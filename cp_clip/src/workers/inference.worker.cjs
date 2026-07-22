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

parentPort.on('message', async (msg) => {
  if (msg.type === 'init') {
    const physicalModelPath = msg.physicalModelPath;
    if (ort && fs.existsSync(physicalModelPath)) {
      try {
        console.log("[Inference Worker] Loading MobileCLIP Image Encoder ONNX model from:", physicalModelPath);
        if (sharp) {
          sharp.concurrency(1); // Restrict sharp threads
          sharp.cache(false); // Disable cache to prevent memory leak
        }
        const sessionOptions = {
          executionProviders: ['dml', 'cpu'],
          executionMode: 'sequential',
          intraOpNumThreads: 1,
          interOpNumThreads: 1
        };
        try {
          ortSession = await ort.InferenceSession.create(physicalModelPath, sessionOptions);
        } catch (dmlErr) {
          console.warn("[Inference Worker] DirectML GPU provider failed (" + dmlErr.message + "). Falling back to CPU provider for Image Encoder...");
          ortSession = await ort.InferenceSession.create(physicalModelPath, {
            executionProviders: ['cpu'],
            executionMode: 'sequential',
            intraOpNumThreads: 1,
            interOpNumThreads: 1
          });
        }
        console.log("[Inference Worker] MobileCLIP Image Encoder ONNX model loaded successfully.");
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
  } else if (msg.type === 'compute') {
    const reqId = msg.reqId;
    const imagePath = msg.imagePath;

    try {
      if (!ortSession || !sharp) {
        throw new Error("Model session or Sharp is not initialized.");
      }

      // Real inference path
      const { data, info } = await sharp(imagePath)
        .resize(256, 256, {
          fit: 'cover',
          position: 'center'
        })
        .removeAlpha()
        .toColourspace('srgb')
        .raw()
        .toBuffer({ resolveWithObject: true });

      if (info.width !== 256 || info.height !== 256 || info.channels !== 3) {
        throw new Error(`Sharp resize output invalid: ${info.width}x${info.height}x${info.channels}`);
      }

      const float32Data = new Float32Array(3 * 256 * 256);
      const imageSize = 256 * 256;

      for (let i = 0; i < imageSize; i++) {
        float32Data[i] = data[i * 3] / 255.0;
        float32Data[imageSize + i] = data[i * 3 + 1] / 255.0;
        float32Data[2 * imageSize + i] = data[i * 3 + 2] / 255.0;
      }

      const tensor = new ort.Tensor('float32', float32Data, [1, 3, 256, 256]);
      const inputName = ortSession.inputNames[0];
      const feeds = {};
      feeds[inputName] = tensor;

      const outputs = await ortSession.run(feeds);
      const outputName = ortSession.outputNames[0];
      const imageEmbedding = new Float32Array(outputs[outputName].data);

      parentPort.postMessage({ type: 'compute_result', reqId, success: true, embedding: imageEmbedding });

    } catch (err) {
      console.error(`[Inference Worker] Compute Error for ${imagePath}:`, err);
      parentPort.postMessage({ type: 'compute_result', reqId, success: false, error: err.message });
    }
  }
});
