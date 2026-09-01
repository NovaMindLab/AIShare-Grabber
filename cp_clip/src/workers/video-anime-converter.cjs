/**
 * VideoAnimeConverter.cjs
 * 
 * High-performance, streaming-based video AnimeGAN transformation module for Electron.
 * Features:
 * 1. Zero-disk-IO FFmpeg stdio raw video pipeline (rgb24 raw frames)
 * 2. Onnxruntime-node DirectML/CPU accelerated inference
 * 3. Pure TypedArray interleaved/NCHW pixel normalization and de-normalization
 * 4. Memory-safe backpressure control (constant ~3MB buffer)
 * 5. Real-time progress, FPS, ETA, and sample frame preview broadcasting
 * 6. Clean task cancellation and temporary resource disposal
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ort = require('onnxruntime-node');

class VideoAnimeConverter {
  constructor(options = {}) {
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.ffprobePath = options.ffprobePath || 'ffprobe';
    this.isCancelled = false;
    this.decodeProcess = null;
    this.encodeProcess = null;
    this.session = null;
    this.isGpuMode = false;
    this.tempFiles = [];
  }

  /**
   * Probe source video properties via ffprobe
   * @param {string} videoPath 
   * @returns {Promise<{width: number, height: number, fps: number, duration: number, totalFrames: number, hasAudio: boolean}>}
   */
  async probeVideo(videoPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,duration,nb_frames',
        '-show_entries', 'format=duration',
        '-of', 'json',
        videoPath
      ];

      let proc;
      try {
        proc = spawn(this.ffprobePath, args);
      } catch (err) {
        return reject(new Error(`Failed to spawn ffprobe (${this.ffprobePath}): ${err.message}`));
      }

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', chunk => { stdout += chunk; });
      proc.stderr.on('data', chunk => { stderr += chunk; });

      proc.on('close', async (code) => {
        if (code !== 0) {
          return reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
        }
        try {
          const data = JSON.parse(stdout);
          const vStream = (data.streams && data.streams[0]) || {};
          let width = parseInt(vStream.width, 10) || 1280;
          let height = parseInt(vStream.height, 10) || 720;
          
          // Parse FPS
          let fps = 30;
          if (vStream.r_frame_rate) {
            const parts = vStream.r_frame_rate.split('/');
            if (parts.length === 2 && parseInt(parts[1], 10) > 0) {
              fps = Math.round(parseInt(parts[0], 10) / parseInt(parts[1], 10));
            } else {
              fps = parseInt(vStream.r_frame_rate, 10) || 30;
            }
          }
          if (fps <= 0 || isNaN(fps)) fps = 30;

          // Parse Duration
          let duration = parseFloat(vStream.duration) || parseFloat(data.format?.duration) || 0;
          
          // Parse Total Frames
          let totalFrames = parseInt(vStream.nb_frames, 10);
          if (!totalFrames || isNaN(totalFrames)) {
            totalFrames = Math.round(duration * fps) || 100;
          }

          // Check if audio exists
          const hasAudio = await this.checkAudioStream(videoPath);

          resolve({
            width,
            height,
            fps,
            duration,
            totalFrames,
            hasAudio
          });
        } catch (e) {
          reject(e);
        }
      });

      proc.on('error', err => reject(new Error(`ffprobe error (${this.ffprobePath}): ${err.message}`)));
    });
  }

  /**
   * Check if video has an audio stream
   * @param {string} videoPath 
   * @returns {Promise<boolean>}
   */
  checkAudioStream(videoPath) {
    return new Promise(resolve => {
      const args = [
        '-v', 'error',
        '-select_streams', 'a:0',
        '-show_entries', 'stream=codec_type',
        '-of', 'json',
        videoPath
      ];
      let proc;
      try {
        proc = spawn(this.ffprobePath, args);
      } catch (_) {
        return resolve(false);
      }
      let stdout = '';
      proc.stdout.on('data', chunk => { stdout += chunk; });
      proc.on('close', code => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            resolve(!!(data.streams && data.streams.length > 0));
          } catch (_) {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      });
      proc.on('error', () => resolve(false));
    });
  }

  /**
   * Calculate 32-pixel aligned dimensions with aspect ratio preservation
   */
  computeTargetDimensions(srcWidth, srcHeight, maxDimension = 480) {
    let w = srcWidth || 640;
    let h = srcHeight || 360;
    const maxEdge = Math.max(w, h);

    if (maxEdge > maxDimension) {
      if (w >= h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }

    // Force dimensions to be multiples of 32 for neural network processing & H.264 compatibility
    w = Math.max(32, Math.floor(w / 32) * 32);
    h = Math.max(32, Math.floor(h / 32) * 32);

    return { targetWidth: w, targetHeight: h };
  }

  /**
   * Extract audio stream to temporary file
   */
  extractAudio(inputPath, tempAudioPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', inputPath,
        '-vn',
        '-c:a', 'aac',
        '-b:a', '192k',
        tempAudioPath
      ];
      let proc;
      try {
        proc = spawn(this.ffmpegPath, args);
      } catch (err) {
        return reject(new Error(`Failed to spawn ffmpeg for audio extraction: ${err.message}`));
      }
      this.tempFiles.push(tempAudioPath);

      let stderr = '';
      proc.stderr.on('data', c => { stderr += c; });

      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`Audio extraction failed with code ${code}: ${stderr}`));
      });
      proc.on('error', err => reject(err));
    });
  }

  /**
   * Initialize ONNX Runtime Inference Session (Multi-threaded CPU with SIMD optimization for rock-solid stability)
   */
  async initSession(modelPath) {
    const threadCount = Math.max(2, Math.min(os.cpus().length, 8));
    try {
      this.session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all',
        intraOpNumThreads: threadCount,
        enableCpuMemArena: true
      });
      this.isGpuMode = false;
      console.log(`[Video Anime] Initialized CPU multi-threaded session (${threadCount} threads) for ${path.basename(modelPath)}`);
    } catch (e) {
      console.error(`[Video Anime] Failed to initialize ONNX session:`, e);
      throw e;
    }
  }

  /**
   * Main Pipeline Execution
   * @param {Object} params
   * @param {string} params.inputPath - Source video path
   * @param {string} params.outputPath - Result video path
   * @param {string} params.modelPath - AnimeGAN ONNX model file path
   * @param {number} [params.maxDimension=480] - Maximum dimension for scaling
   * @param {string} [params.frameRateMode='anime15'] - 'anime15' | 'full' | 'anime10'
   * @param {Function} [onProgress] - Callback (progressData) => void
   */
  async convert(params, onProgress = () => {}) {
    this.isCancelled = false;
    const { 
      inputPath, 
      outputPath, 
      modelPath, 
      maxDimension = 480,
      frameRateMode = 'anime15'
    } = params;

    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入视频文件不存在: ${inputPath}`);
    }
    if (!fs.existsSync(modelPath)) {
      throw new Error(`AnimeGAN 模型文件不存在: ${modelPath}`);
    }

    // 1. Probe video metadata
    const meta = await this.probeVideo(inputPath);
    const { targetWidth, targetHeight } = this.computeTargetDimensions(meta.width, meta.height, maxDimension);
    const fps = meta.fps;
    const totalFrames = meta.totalFrames;
    const frameByteSize = targetWidth * targetHeight * 3;

    // Calculate frame stride based on anime frame rate mode
    let stride = 1;
    if (frameRateMode === 'anime15') {
      stride = fps >= 20 ? Math.max(1, Math.round(fps / 15)) : 1;
      if (stride < 2 && fps >= 20) stride = 2;
    } else if (frameRateMode === 'anime10') {
      stride = fps >= 18 ? Math.max(1, Math.round(fps / 10)) : 2;
      if (stride < 3 && fps >= 24) stride = 3;
    }

    // Prepare temp output paths
    const tempDir = os.tmpdir();
    const nonce = Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const tempVideoOnlyPath = path.join(tempDir, `anime_v_${nonce}.mp4`);
    const tempAudioPath = path.join(tempDir, `anime_a_${nonce}.aac`);
    this.tempFiles.push(tempVideoOnlyPath);

    // 2. Extract audio if present
    if (meta.hasAudio) {
      try {
        await this.extractAudio(inputPath, tempAudioPath);
      } catch (e) {
        console.warn('[Video Anime] Audio extraction warning:', e.message);
      }
    }

    // 3. Initialize ONNX Runtime Inference Session
    await this.initSession(modelPath);

    const inputName = this.session.inputNames[0];
    const outputName = this.session.outputNames[0];

    // 4. Spawn FFmpeg Decode & Encode Processes
    // Decode: Video -> raw rgb24 via stdout
    const decodeArgs = [
      '-y',
      '-i', inputPath,
      '-vf', `scale=${targetWidth}:${targetHeight},format=rgb24`,
      '-f', 'rawvideo',
      '-pix_fmt', 'rgb24',
      '-'
    ];
    try {
      this.decodeProcess = spawn(this.ffmpegPath, decodeArgs);
    } catch (err) {
      this.cleanup();
      throw new Error(`无法启动 FFmpeg 解码器 (${this.ffmpegPath}): ${err.message}`);
    }

    let decodeStderr = '';
    this.decodeProcess.stderr.on('data', chunk => {
      decodeStderr += chunk.toString();
    });

    // Encode: raw rgb24 via stdin -> Video MP4
    const encodeArgs = [
      '-y',
      '-f', 'rawvideo',
      '-pix_fmt', 'rgb24',
      '-s', `${targetWidth}x${targetHeight}`,
      '-r', `${fps}`,
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '20',
      tempVideoOnlyPath
    ];
    try {
      this.encodeProcess = spawn(this.ffmpegPath, encodeArgs);
    } catch (err) {
      this.cleanup();
      throw new Error(`无法启动 FFmpeg 编码器 (${this.ffmpegPath}): ${err.message}`);
    }

    let encodeStderr = '';
    this.encodeProcess.stderr.on('data', chunk => {
      encodeStderr += chunk.toString();
    });

    // Setup Process Error & Exit Handlers
    let encodeFinishedPromise = new Promise((resolve, reject) => {
      this.encodeProcess.on('close', code => {
        if (code === 0) resolve();
        else if (!this.isCancelled) reject(new Error(`Encode process exited with code ${code}: ${encodeStderr.slice(-400)}`));
        else resolve();
      });
      this.encodeProcess.on('error', err => reject(err));
    });

    // 5. Streaming Frame Pipeline with Stride & Backpressure
    let bufferRemainder = Buffer.alloc(0);
    let processedFrames = 0;
    let rawFrameIndex = 0;
    let actualAiFrames = 0;
    let hasCachedOutput = false;
    const startTime = Date.now();
    let lastFpsCalcTime = startTime;
    let lastFpsCalcFrame = 0;
    let currentFps = 0;

    const framePixelCount = targetWidth * targetHeight;
    // Reuse input Float32Array tensor memory to prevent GC churn
    const inputTensorData = new Float32Array(3 * framePixelCount);
    const outputUint8Buffer = Buffer.allocUnsafe(frameByteSize);

    for await (const chunk of this.decodeProcess.stdout) {
      if (this.isCancelled) break;

      bufferRemainder = Buffer.concat([bufferRemainder, chunk]);

      while (bufferRemainder.length >= frameByteSize) {
        if (this.isCancelled) break;

        const rawFrame = bufferRemainder.subarray(0, frameByteSize);
        bufferRemainder = bufferRemainder.subarray(frameByteSize);

        const shouldRunInference = (rawFrameIndex % stride === 0) || !hasCachedOutput;

        if (shouldRunInference) {
          // Preprocessing for NHWC [1, H, W, 3] with [-1.0, 1.0] scaling
          for (let i = 0; i < frameByteSize; i++) {
            inputTensorData[i] = (rawFrame[i] * (1.0 / 127.5)) - 1.0;
          }
          const inputTensor = new ort.Tensor('float32', inputTensorData, [1, targetHeight, targetWidth, 3]);
          
          let outData = null;
          try {
            const results = await this.session.run({ [inputName]: inputTensor });
            outData = results[outputName].data;
          } catch (inferErr) {
            // DirectML GPU Driver Recovery: Seamlessly hot-switch to CPU and retry
            if (this.isGpuMode) {
              console.warn('[Video Anime] DirectML GPU runtime error, falling back to CPU:', inferErr.message);
              this.isGpuMode = false;
              if (this.session) {
                try { await this.session.release(); } catch (_) {}
              }
              this.session = await ort.InferenceSession.create(modelPath, {
                executionProviders: ['cpu'],
                graphOptimizationLevel: 'all',
                intraOpNumThreads: Math.max(1, Math.min(os.cpus().length, 8))
              });
              const results = await this.session.run({ [inputName]: inputTensor });
              outData = results[outputName].data;
            } else {
              throw inferErr;
            }
          }

          const isNormalized = Math.abs(outData[0]) <= 2.5;

          // Postprocessing for NHWC [1, H, W, 3]
          const outLen = Math.min(frameByteSize, outData.length);
          for (let i = 0; i < outLen; i++) {
            const val = isNormalized ? ((outData[i] + 1.0) * 127.5) : outData[i];
            outputUint8Buffer[i] = val < 0 ? 0 : (val > 255 ? 255 : (val | 0));
          }

          hasCachedOutput = true;
          actualAiFrames++;
        }

        // Write to encode process with backpressure flow control
        const canWriteMore = this.encodeProcess.stdin.write(outputUint8Buffer);
        if (!canWriteMore) {
          await new Promise(resolve => this.encodeProcess.stdin.once('drain', resolve));
        }

        processedFrames++;
        rawFrameIndex++;

        // Progress Calculation & Broadcast every 5 frames
        const now = Date.now();
        if (processedFrames % 5 === 0 || processedFrames === totalFrames) {
          const timeDiff = (now - lastFpsCalcTime) / 1000;
          if (timeDiff >= 0.5) {
            currentFps = Math.round(((processedFrames - lastFpsCalcFrame) / timeDiff) * 10) / 10;
            lastFpsCalcTime = now;
            lastFpsCalcFrame = processedFrames;
          }

          const percent = Math.min(99, Math.round((processedFrames / totalFrames) * 100));
          const remainingFrames = Math.max(0, totalFrames - processedFrames);
          const etaSeconds = currentFps > 0 ? Math.round(remainingFrames / currentFps) : 0;

          onProgress({
            currentFrame: processedFrames,
            totalFrames,
            percent,
            fps: currentFps,
            etaSeconds,
            stage: 'transforming',
            stride,
            actualAiFrames,
            isGpuMode: this.isGpuMode
          });
        }
      }
    }

    // Finish writing to encoder
    if (this.encodeProcess && this.encodeProcess.stdin) {
      this.encodeProcess.stdin.end();
    }
    await encodeFinishedPromise;

    if (this.isCancelled) {
      this.cleanup();
      throw new Error('Conversion was cancelled by user');
    }

    // 6. Final Muxing: Merge Video & Audio into Destination
    onProgress({ percent: 99, stage: 'muxing', text: '正在混流音视频并输出最终 MP4...', currentFrame: processedFrames, totalFrames, fps: currentFps });
    await this.muxFinalOutput(tempVideoOnlyPath, meta.hasAudio ? tempAudioPath : null, outputPath);

    // 7. Cleanup temp files
    this.cleanup();

    onProgress({ percent: 100, stage: 'completed', text: '动漫化转换完成！', outputPath, currentFrame: processedFrames, totalFrames, fps: currentFps });
    return { outputPath, totalFrames: processedFrames };
  }

  /**
   * Merge video stream and audio stream into final MP4
   */
  muxFinalOutput(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
      // Ensure target folder exists
      const targetDir = path.dirname(outputPath);
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      } catch (e) {
        return reject(new Error(`无法创建输出目录 (${targetDir}): ${e.message}`));
      }

      const args = ['-y', '-i', videoPath];
      if (audioPath && fs.existsSync(audioPath)) {
        args.push('-i', audioPath, '-c:v', 'copy', '-c:a', 'aac', '-shortest');
      } else {
        args.push('-c:v', 'copy');
      }
      args.push(outputPath);

      let proc;
      try {
        proc = spawn(this.ffmpegPath, args);
      } catch (err) {
        return reject(new Error(`无法启动 FFmpeg 进行音视频混流: ${err.message}`));
      }

      let stderr = '';
      proc.stderr.on('data', c => { stderr += c; });

      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`混流输出失败 (code ${code}): ${stderr.slice(-400)}`));
      });
      proc.on('error', err => reject(err));
    });
  }

  /**
   * Cancel conversion and terminate all child processes
   */
  cancel() {
    this.isCancelled = true;
    if (this.decodeProcess) {
      try { this.decodeProcess.kill('SIGKILL'); } catch (_) {}
    }
    if (this.encodeProcess) {
      try { this.encodeProcess.kill('SIGKILL'); } catch (_) {}
    }
    this.cleanup();
  }

  /**
   * Clean temporary files and release session
   */
  cleanup() {
    for (const f of this.tempFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (_) {}
    }
    this.tempFiles = [];
    if (this.session) {
      try { this.session.release(); } catch (_) {}
      this.session = null;
    }
  }
}

module.exports = VideoAnimeConverter;
