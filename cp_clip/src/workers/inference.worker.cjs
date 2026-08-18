const { parentPort } = require('worker_threads');
const fs = require('fs');
let ort;
let sharp;

try {
  ort = require('onnxruntime-node');
} catch (err) {
  console.error("[Inference Worker] Critical: Failed to load onnxruntime-node.", err);
}

try {
  sharp = require('sharp');
} catch (err) {
  console.error("[Inference Worker] Critical: Failed to load sharp.", err);
}

let ortSession = null;
let scrfdSession = null;
let mobilefacenetSession = null;

parentPort.on('message', async (msg) => {
  if (msg.type === 'init') {
    const physicalModelPath = msg.physicalModelPath;
    const physicalScrfdModelPath = msg.physicalScrfdModelPath;
    const physicalMobilefacenetModelPath = msg.physicalMobilefacenetModelPath;

    if (ort && fs.existsSync(physicalModelPath)) {
      try {
        console.log("[Inference Worker] Loading MobileCLIP Image Encoder ONNX model from:", physicalModelPath);
        if (sharp) {
          sharp.concurrency(1); // Restrict sharp threads
          sharp.cache(false); // Disable cache to prevent memory leak
        }
        const sessionOptions = {
          executionProviders: ['cpu'],
          executionMode: 'sequential',
          intraOpNumThreads: 1,
          interOpNumThreads: 1
        };
        ortSession = await ort.InferenceSession.create(physicalModelPath, sessionOptions);
        console.log("[Inference Worker] MobileCLIP Image Encoder ONNX model loaded successfully (CPU execution provider).");

        if (physicalScrfdModelPath && fs.existsSync(physicalScrfdModelPath)) {
          try {
            scrfdSession = await ort.InferenceSession.create(physicalScrfdModelPath, sessionOptions);
            console.log("[Inference Worker] SCRFD Face Detection ONNX model loaded successfully.");
          } catch (e) {
            console.warn("[Inference Worker] SCRFD model load failed, face detection disabled:", e.message);
          }
        }

        if (physicalMobilefacenetModelPath && fs.existsSync(physicalMobilefacenetModelPath)) {
          try {
            mobilefacenetSession = await ort.InferenceSession.create(physicalMobilefacenetModelPath, sessionOptions);
            console.log("[Inference Worker] MobileFaceNet Face Embedding ONNX model loaded successfully.");
          } catch (e) {
            console.warn("[Inference Worker] MobileFaceNet model load failed, face embedding disabled:", e.message);
          }
        }

        parentPort.postMessage({ type: 'init_result', success: true });
      } catch (err) {
        console.error("[Inference Worker] Failed to initialize Image Encoder ONNX model session:", err);
        parentPort.postMessage({ type: 'init_result', success: false, error: err.message });
      }
    } else {
      const errMsg = "[Inference Worker] Image Encoder ONNX model not found or onnxruntime-node missing.";
      console.error(errMsg);
      parentPort.postMessage({ type: 'init_result', success: false, error: errMsg });
    }
  } else if (msg.type === 'compute_clip') {
    const reqId = msg.reqId;
    const imagePath = msg.imagePath;

    try {
      if (!ortSession || !sharp) {
        throw new Error("Model session or Sharp is not initialized.");
      }

      let timings = {};
      const tStart = performance.now();

      // Real inference path
      const clipBuffer = await sharp(imagePath)
        .resize(256, 256, { fit: 'cover', position: 'center' })
        .removeAlpha()
        .toColourspace('srgb')
        .raw()
        .toBuffer();

      const float32Data = new Float32Array(3 * 256 * 256);
      const imageSize = 256 * 256;
      for (let i = 0; i < imageSize; i++) {
        float32Data[i] = clipBuffer[i * 3] / 255.0;
        float32Data[imageSize + i] = clipBuffer[i * 3 + 1] / 255.0;
        float32Data[2 * imageSize + i] = clipBuffer[i * 3 + 2] / 255.0;
      }

      const tensor = new ort.Tensor('float32', float32Data, [1, 3, 256, 256]);
      const inputName = ortSession.inputNames[0];
      const feeds = {};
      feeds[inputName] = tensor;

      const tClipStart = performance.now();
      const outputs = await ortSession.run(feeds);
      timings.clipTime = performance.now() - tClipStart;
      timings.sharpClipPrep = tClipStart - tStart;
      const outputName = ortSession.outputNames[0];
      const imageEmbedding = new Float32Array(outputs[outputName].data);

      parentPort.postMessage({ type: 'compute_result', reqId, success: true, embedding: imageEmbedding, faces: [], timings });
    } catch (err) {
      console.error(`[Inference Worker] Compute Error for ${imagePath}:`, err);
      parentPort.postMessage({ type: 'compute_result', reqId, success: false, error: err.message });
    }
  } else if (msg.type === 'compute_face') {
    const reqId = msg.reqId;
    const imagePath = msg.imagePath;

    try {
      if (!scrfdSession || !sharp) {
        throw new Error("Face models or Sharp not initialized.");
      }
      
      let timings = {};
      const tStart = performance.now();
      const faces = [];
      const imageBuffer = await fs.promises.readFile(imagePath);
        try {
          const metadata = await sharp(imageBuffer).metadata();
          const origW = metadata.width || 500;
          const origH = metadata.height || 500;
          
          const scaleW = origW / 640.0;
          const scaleH = origH / 640.0;

          const tScrfdPrepStart = performance.now();
          const scrfdData = await sharp(imageBuffer)
            .resize(640, 640, { fit: 'fill' })
            .removeAlpha()
            .toColourspace('srgb')
            .raw()
            .toBuffer();
          
          const scrfdFloat32 = new Float32Array(3 * 640 * 640);
          const scrfdImageSize = 640 * 640;
          
          // Preprocess: RGB, float32, mean=127.5, std=128
          for (let i = 0; i < scrfdImageSize; i++) {
            scrfdFloat32[i] = (scrfdData[i * 3] - 127.5) / 128.0;
            scrfdFloat32[scrfdImageSize + i] = (scrfdData[i * 3 + 1] - 127.5) / 128.0;
            scrfdFloat32[2 * scrfdImageSize + i] = (scrfdData[i * 3 + 2] - 127.5) / 128.0;
          }
          
          const scrfdTensor = new ort.Tensor('float32', scrfdFloat32, [1, 3, 640, 640]);
          const scrfdFeeds = {};
          scrfdFeeds[scrfdSession.inputNames[0]] = scrfdTensor;
          
          const tScrfdRunStart = performance.now();
          const scrfdOutputs = await scrfdSession.run(scrfdFeeds);
          timings.scrfdTime = performance.now() - tScrfdRunStart;
          timings.sharpScrfdPrep = tScrfdRunStart - tScrfdPrepStart;
          
          if (!global.scrfdLogged) {
             console.log("[Inference Worker] First run SCRFD outputs:");
             for (const key of Object.keys(scrfdOutputs)) {
                console.log(` - ${key}:`, scrfdOutputs[key].dims);
             }
             global.scrfdLogged = true;
          }
          
          let candidates = [];
          const anchorCounts = [12800, 3200, 800];
          const strideMap = { 12800: 8, 3200: 16, 800: 32 };

          for (const count of anchorCounts) {
             const stride = strideMap[count];
             let scoreTensor = null;
             let bboxTensor = null;

             for (const key of Object.keys(scrfdOutputs)) {
                const t = scrfdOutputs[key];
                const dims = t.dims;
                if (dims.includes(count)) {
                   const lastDim = dims[dims.length - 1];
                   if (lastDim === 1) scoreTensor = t;
                   else if (lastDim === 4) bboxTensor = t;
                }
             }
             if (!scoreTensor || !bboxTensor) continue;

             const scoreData = scoreTensor.data;
             const bboxData = bboxTensor.data;
             const anchorsPerLocation = Math.round(count / ((640 / stride) * (640 / stride)));
             const gridH = 640 / stride;
             const gridW = 640 / stride;

             let idx = 0;
             for (let y = 0; y < gridH; y++) {
                for (let x = 0; x < gridW; x++) {
                   const cx = x * stride + (stride / 2);
                   const cy = y * stride + (stride / 2);

                   for (let a = 0; a < anchorsPerLocation; a++) {
                      const score = scoreData[idx];
                      // High precision face threshold (0.68) to eliminate food, textured objects, background false positives
                      if (score >= 0.68) {
                         const bIdx = idx * 4;
                         let l = bboxData[bIdx] * stride;
                         let t = bboxData[bIdx + 1] * stride;
                         let r = bboxData[bIdx + 2] * stride;
                         let b = bboxData[bIdx + 3] * stride;

                         let xmin = (cx - l) * scaleW;
                         let ymin = (cy - t) * scaleH;
                         let xmax = (cx + r) * scaleW;
                         let ymax = (cy + b) * scaleH;

                         const candW = xmax - xmin;
                         const candH = ymax - ymin;
                         const aspect = candW / (candH || 1);

                         // Human face bounding box aspect ratio constraint (0.55 ~ 1.6)
                         if (candW > 0 && candH > 0 && aspect >= 0.55 && aspect <= 1.6) {
                            candidates.push({ xmin, ymin, xmax, ymax, score });
                         }
                      }
                      idx++;
                   }
                }
             }
          }
          
          // NMS
          candidates.sort((a, b) => b.score - a.score);
          let finalFaces = [];
          for (const cand of candidates) {
             let keep = true;
             for (const f of finalFaces) {
                const ix = Math.max(cand.xmin, f.xmin);
                const iy = Math.max(cand.ymin, f.ymin);
                const ixx = Math.min(cand.xmax, f.xmax);
                const iyy = Math.min(cand.ymax, f.ymax);
                const interArea = Math.max(0, ixx - ix) * Math.max(0, iyy - iy);
                const candArea = (cand.xmax - cand.xmin) * (cand.ymax - cand.ymin);
                const fArea = (f.xmax - f.xmin) * (f.ymax - f.ymin);
                const iou = interArea / (candArea + fArea - interArea);
                if (iou > 0.4) {
                   keep = false;
                   break;
                }
             }
             if (keep) {
                finalFaces.push(cand);
             }
          }

          // Quality & Crowd Filter: discard tiny low-res/background bystander faces
          // In high density crowd photos (>8 faces), require at least 55px; otherwise at least 42px
          const minPixelSize = finalFaces.length > 8 ? 55 : 42;
          finalFaces = finalFaces.filter(f => {
             const w = f.xmax - f.xmin;
             const h = f.ymax - f.ymin;
             return w >= minPixelSize && h >= minPixelSize;
          });

          // Cap at top 15 most prominent faces per photo to prevent background audience explosion
          if (finalFaces.length > 15) {
             finalFaces = finalFaces.slice(0, 15);
          }

          timings.scrfdNmsTime = performance.now() - (tScrfdRunStart + timings.scrfdTime);
          
          // Run mobilefacenet
          if (mobilefacenetSession && finalFaces.length > 0) {
             for (const f of finalFaces) {
                try {
                   const w = f.xmax - f.xmin;
                   const h = f.ymax - f.ymin;
                   
                   const padW = w * 0.1;
                   const padH = h * 0.1;
                   
                   let cropLeft = Math.floor(Math.max(0, f.xmin - padW));
                   let cropTop = Math.floor(Math.max(0, f.ymin - padH));
                   let cropRight = Math.floor(Math.min(origW, f.xmax + padW));
                   let cropBottom = Math.floor(Math.min(origH, f.ymax + padH));
                   let cropWidth = cropRight - cropLeft;
                   let cropHeight = cropBottom - cropTop;

                   const tFaceNetPrep = performance.now();
                   const { data: faceData } = await sharp(imageBuffer)
                     .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
                     .resize(112, 112, { fit: 'fill' })
                     .removeAlpha()
                     .toColourspace('srgb')
                     .raw()
                     .toBuffer({ resolveWithObject: true });
                   
                   const faceFloat32 = new Float32Array(3 * 112 * 112);
                   const faceImageSize = 112 * 112;
                   for (let i = 0; i < faceImageSize; i++) {
                     faceFloat32[i] = (faceData[i * 3] - 127.5) / 128.0;
                     faceFloat32[faceImageSize + i] = (faceData[i * 3 + 1] - 127.5) / 128.0;
                     faceFloat32[2 * faceImageSize + i] = (faceData[i * 3 + 2] - 127.5) / 128.0;
                   }
                   
                   const faceTensor = new ort.Tensor('float32', faceFloat32, [1, 3, 112, 112]);
                   const faceFeeds = {};
                   faceFeeds[mobilefacenetSession.inputNames[0]] = faceTensor;
                   const tFaceNetRun = performance.now();
                   const faceOutputs = await mobilefacenetSession.run(faceFeeds);
                   
                   timings.faceNetTime = (timings.faceNetTime || 0) + (performance.now() - tFaceNetRun);
                   timings.sharpFaceNetPrep = (timings.sharpFaceNetPrep || 0) + (tFaceNetRun - tFaceNetPrep);
                   
                   let faceEmbedding = new Float32Array(faceOutputs[mobilefacenetSession.outputNames[0]].data);
                   
                   let sum = 0;
                   for (let i = 0; i < faceEmbedding.length; i++) {
                      sum += faceEmbedding[i] * faceEmbedding[i];
                   }
                   const norm = Math.sqrt(sum) || 1;
                   for (let i = 0; i < faceEmbedding.length; i++) {
                      faceEmbedding[i] /= norm;
                   }
                   
                   const faceId = `face_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
                   faces.push({
                     id: faceId,
                     path: imagePath,
                     bbox: JSON.stringify([cropLeft, cropTop, cropWidth, cropHeight]),
                     landmarks: null,
                     embedding: faceEmbedding
                   });
                } catch (cropErr) {
                   console.warn("[Inference Worker] Failed to process face:", cropErr.message);
                }
             }
          }
        } catch (err) {
           console.error("[Inference Worker] SCRFD execution error:", err);
        }
      timings.totalTime = Math.round(performance.now() - tStart);
      parentPort.postMessage({ type: 'compute_result', reqId, success: true, faces, timings });
    } catch (err) {
      console.error(`[Inference Worker] Compute Face Error for ${imagePath}:`, err);
      parentPort.postMessage({ type: 'compute_result', reqId, success: false, error: err.message });
    }
  }
});
