import * as ort from 'onnxruntime-web';

let session = null;
let textEmbeddings = null;
let providerInUse = 'unknown';

// Configure ONNX Runtime WASM Paths
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

// Use absolute origin URL to prevent Vite dev server from intercepting dynamic public module imports
const baseOrigin = (typeof self !== 'undefined' && self.location && self.location.origin) ? self.location.origin : '';
ort.env.wasm.wasmPaths = baseOrigin ? `${baseOrigin}/ort-wasm/` : 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';

/**
 * Fetch model with CacheStorage caching (Version 2 for MobileCLIP2-S0)
 */
async function fetchCachedModel(url) {
  const cacheName = 'webshare-ai-models-v2';
  let response;

  if ('caches' in self) {
    try {
      const cache = await caches.open(cacheName);
      response = await cache.match(url);
      if (response) {
        console.log(`[AI Worker] Loaded model from CacheStorage: ${url}`);
        return await response.arrayBuffer();
      }
    } catch (e) {
      console.warn('[AI Worker] CacheStorage lookup failed:', e);
    }
  }

  console.log(`[AI Worker] Fetching model from network: ${url}`);
  const fetchRes = await fetch(url);
  if (!fetchRes.ok) {
    throw new Error(`Failed to fetch model from ${url}: ${fetchRes.status} ${fetchRes.statusText}`);
  }

  const arrayBuffer = await fetchRes.arrayBuffer();

  if ('caches' in self) {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(url, new Response(arrayBuffer.slice(0), {
        headers: { 'Content-Type': 'application/octet-stream' }
      }));
      console.log(`[AI Worker] Cached model into CacheStorage: ${url}`);
    } catch (e) {
      console.warn('[AI Worker] CacheStorage write failed:', e);
    }
  }

  return arrayBuffer;
}

/**
 * Initialize MobileCLIP2-S0 ONNX Runtime Session & Text Embeddings
 */
async function initEngine(modelUrl = '/models/mobileclip2_s0_image_encoder.onnx', textEmbUrl = '/models/text_embeddings.json') {
  try {
    // 1. Load Text Embeddings
    console.log('[AI Worker] Loading text embeddings from:', textEmbUrl);
    const textRes = await fetch(textEmbUrl);
    textEmbeddings = await textRes.json();
    console.log(`[AI Worker] Loaded ${Object.keys(textEmbeddings).length} text category embeddings.`);

    // 2. Load Image Encoder ONNX Model
    console.log('[AI Worker] Fetching MobileCLIP2-S0 ONNX model buffer from:', modelUrl);
    const modelBuffer = await fetchCachedModel(modelUrl);

    // 3. Check WebGPU availability and try WebGPU provider
    let gpuSupported = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) gpuSupported = true;
      }
    } catch (_) {}

    if (gpuSupported) {
      try {
        console.log('[AI Worker] Attempting ONNX Session with WebGPU provider...');
        session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ['webgpu']
        });
        providerInUse = 'webgpu';
        console.log('✨ [AI Worker] ONNX Session created successfully with WebGPU acceleration!');
      } catch (gpuErr) {
        console.warn('[AI Worker] WebGPU session creation failed, falling back to WASM:', gpuErr.message);
      }
    }

    // Fallback to WASM CPU if WebGPU is not used
    if (!session) {
      console.log('[AI Worker] Creating ONNX Session with WASM CPU provider...');
      session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm']
      });
      providerInUse = 'wasm';
      console.log('⚡ [AI Worker] ONNX Session created successfully with WASM CPU provider.');
    }

    self.postMessage({
      type: 'init_result',
      success: true,
      provider: providerInUse,
      categoryCount: Object.keys(textEmbeddings).length
    });
  } catch (err) {
    console.error('[AI Worker] Failed to initialize engine:', err);
    self.postMessage({
      type: 'init_result',
      success: false,
      error: err.message
    });
  }
}

/**
 * Preprocess Image using OffscreenCanvas and normalize to [1, 3, 256, 256] Planar RGB
 */
async function preprocessImage(blobOrBuffer) {
  let blob = blobOrBuffer instanceof Blob ? blobOrBuffer : new Blob([blobOrBuffer]);
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Center crop / cover resize to 256x256
  const scale = Math.max(256 / bitmap.width, 256 / bitmap.height);
  const scaledWidth = bitmap.width * scale;
  const scaledHeight = bitmap.height * scale;
  const offsetX = (256 - scaledWidth) / 2;
  const offsetY = (256 - scaledHeight) / 2;

  ctx.drawImage(bitmap, offsetX, offsetY, scaledWidth, scaledHeight);
  bitmap.close();

  const imgData = ctx.getImageData(0, 0, 256, 256).data;
  const float32Data = new Float32Array(3 * 256 * 256);
  const imageSize = 256 * 256;

  // Planar RGB format [0, 1] matching MobileCLIP2 image encoder
  for (let i = 0; i < imageSize; i++) {
    float32Data[i] = imgData[i * 4] / 255.0;                 // Red
    float32Data[imageSize + i] = imgData[i * 4 + 1] / 255.0; // Green
    float32Data[2 * imageSize + i] = imgData[i * 4 + 2] / 255.0; // Blue
  }

  return float32Data;
}

/**
 * Cosine Similarity between two 512-D vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < 512; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return (normA === 0 || normB === 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Run Zero-Shot Classification with Softmax Temperature 60.0
 */
function classifyEmbedding(imageEmbedding) {
  if (!textEmbeddings) return [];

  const similarities = [];
  for (const [category, textEmb] of Object.entries(textEmbeddings)) {
    if (textEmb && textEmb.length > 0) {
      const score = cosineSimilarity(imageEmbedding, textEmb);
      similarities.push({ category, score });
    }
  }

  const temperature = 60.0;
  const expScores = similarities.map(s => ({
    category: s.category,
    exp: Math.exp(s.score * temperature)
  }));
  const sumExp = expScores.reduce((acc, cur) => acc + cur.exp, 0);

  const results = expScores.map(s => ({
    category: s.category,
    score: sumExp > 0 ? (s.exp / sumExp) : 0
  }));

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

/**
 * Process single inference job
 */
async function processJob(job) {
  const { jobId, photoId, buffer } = job;
  const tStart = performance.now();

  try {
    if (!session) {
      throw new Error('AI Session not initialized');
    }

    const tPrepStart = performance.now();
    const float32Data = await preprocessImage(buffer);
    const tPrep = performance.now() - tPrepStart;

    const inputName = session.inputNames[0];
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, 256, 256]);
    
    const tInferStart = performance.now();
    const outputs = await session.run({ [inputName]: tensor });
    const tInfer = performance.now() - tInferStart;

    const outputName = session.outputNames[0];
    const embedding = new Float32Array(outputs[outputName].data);

    // Compute Zero-Shot Classification
    const categories = classifyEmbedding(embedding);
    const totalTime = performance.now() - tStart;

    self.postMessage({
      type: 'inference_result',
      jobId,
      photoId,
      success: true,
      embedding: Array.from(embedding),
      categories,
      provider: providerInUse,
      timings: {
        prep: Math.round(tPrep),
        infer: Math.round(tInfer),
        total: Math.round(totalTime)
      }
    });
  } catch (err) {
    console.error(`[AI Worker] Error processing photo ${photoId}:`, err);
    self.postMessage({
      type: 'inference_result',
      jobId,
      photoId,
      success: false,
      error: err.message
    });
  }
}

// Handle incoming messages
self.onmessage = async (event) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === 'init') {
    await initEngine(msg.modelUrl, msg.textEmbUrl);
  } else if (msg.type === 'infer') {
    await processJob(msg);
  }
};
