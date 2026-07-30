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
          
          let scoreTensors = [];
          let bboxTensors = [];
          
          for (const key of Object.keys(scrfdOutputs)) {
             const tensor = scrfdOutputs[key];
             if (tensor.dims.length === 3 && tensor.dims[0] === 1) {
                if (tensor.dims[2] === 1 || key.includes('score')) {
                   scoreTensors.push(tensor);
                } else if (tensor.dims[2] === 4 || key.includes('bbox')) {
                   bboxTensors.push(tensor);
                }
             }
          }
          
          let candidates = [];
          
          // Match score and bbox tensors by their second dimension (num_anchors)
          for (const scoreTensor of scoreTensors) {
             const numAnchors = scoreTensor.dims[1];
             const bboxTensor = bboxTensors.find(t => t.dims[1] === numAnchors);
             if (!bboxTensor) continue;
             
             let stride = 8;
             if (numAnchors === 3200) stride = 16;
             if (numAnchors === 800) stride = 32;
             
             const anchorsPerLocation = Math.round(numAnchors / ((640/stride) * (640/stride)));
             
             const scoreData = scoreTensor.data;
             const bboxData = bboxTensor.data;
             
             let idx = 0;
             const gridH = 640 / stride;
             const gridW = 640 / stride;
             
             for (let y = 0; y < gridH; y++) {
                for (let x = 0; x < gridW; x++) {
                   const cx = x * stride + (stride / 2);
                   const cy = y * stride + (stride / 2);
                   
                   for (let a = 0; a < anchorsPerLocation; a++) {
                      const score = scoreData[idx];
                      if (score > 0.5) {
                         const bIdx = idx * 4;
                         let l = bboxData[bIdx];
                         let t = bboxData[bIdx + 1];
                         let r = bboxData[bIdx + 2];
                         let b = bboxData[bIdx + 3];
                         
                         if (l < 32 && t < 32 && r < 32 && b < 32 && stride > 1) {
                            l *= stride; t *= stride; r *= stride; b *= stride;
                         }

                         let xmin = cx - l;
                         let ymin = cy - t;
                         let xmax = cx + r;
                         let ymax = cy + b;
                         
                         xmin *= scaleW;
                         ymin *= scaleH;
                         xmax *= scaleW;
                         ymax *= scaleH;
                         
                         candidates.push({ xmin, ymin, xmax, ymax, score });
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
      parentPort.postMessage({ type: 'compute_result', reqId, success: true, faces, timings });
    } catch (err) {
      console.error(`[Inference Worker] Compute Face Error for ${imagePath}:`, err);
      parentPort.postMessage({ type: 'compute_result', reqId, success: false, error: err.message });
    }
  }
});
