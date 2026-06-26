const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let ort;
let sharp;

// Dynamically load native dependencies and log errors
try {
  ort = require('onnxruntime-node');
} catch (err) {
  console.error("Critical: Failed to load onnxruntime-node.", err);
}

try {
  sharp = require('sharp');
} catch (err) {
  console.error("Critical: Failed to load sharp.", err);
}

// Register the custom local protocol to bypass CSP and allow local file loading
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      bypassCSP: true,
      secure: true,
      supportFetchSchemes: true,
      stream: true
    }
  }
]);

const { SimpleTokenizer } = require('./tokenizer.cjs');

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
let mainWindow = null;
let ortSession = null;
let textEncoderSession = null;
let tokenizer = null;
let textEmbeddings = {};
let isMockMode = false;
const imageEmbeddingsCache = {}; // imagePath -> Float32Array (512-dim)


// Load ONNX model and embeddings
async function initializeAI() {
  const modelPath = path.join(__dirname, 'mobileclip_image_encoder.onnx');
  const textModelPath = path.join(__dirname, 'mobileclip_text_encoder_quant.onnx');
  const mergesPath = path.join(__dirname, 'merges.txt');
  const embeddingsPath = path.join(__dirname, 'text_embeddings.json');

  // 1. Load Tokenizer BPE Merges
  if (fs.existsSync(mergesPath)) {
    try {
      console.log("[AI Init] Loading BPE merges and initializing tokenizer...");
      const mergesText = fs.readFileSync(mergesPath, 'utf-8');
      tokenizer = new SimpleTokenizer(mergesText);
      console.log("[AI Init] Tokenizer initialized successfully.");
    } catch (err) {
      console.error("[AI Init] Failed to initialize tokenizer:", err);
    }
  } else {
    console.warn("[AI Init] merges.txt not found. Dynamic search will run in mock mode.");
  }

  // 2. Load Text Embeddings
  if (fs.existsSync(embeddingsPath)) {
    try {
      const data = fs.readFileSync(embeddingsPath, 'utf-8');
      textEmbeddings = JSON.parse(data);
      console.log(`[AI Init] Loaded text embeddings with ${Object.keys(textEmbeddings).length} categories.`);
    } catch (err) {
      console.error("[AI Init] Error parsing text_embeddings.json:", err);
    }
  } else {
    console.warn("[AI Init] text_embeddings.json not found. Using fallback mock categories.");
    // Fallback labels for UI demonstration
    textEmbeddings = {
      "🏞️ 乡村与自然风景 (Landscape)": [],
      "🏙️ 城市与建筑 (Cityscape)": [],
      "🐱 宠物与动物 (Pets & Animals)": [],
      "🍜 美食与饮品 (Food & Drinks)": [],
      "🧑 人像与自拍 (Portrait)": [],
      "📄 文档与证件截图 (Document)": [],
      "🚗 车辆与交通工具 (Vehicles)": [],
      "🛍️ 商品与购物 (Shopping)": [],
      "🏠 家居与室内 (Home & Indoors)": [],
      "💻 电脑与数码 (Electronics & Tech)": [],
      "🌸 花卉与植物 (Flowers & Plants)": [],
      "🎨 艺术与设计 (Art & Design)": [],
      "⚽ 运动与健康 (Sports & Fitness)": [],
      "🎸 乐器与音乐 (Music & Instruments)": [],
      "🧸 玩偶与玩具 (Toys & Dolls)": []
    };
  }

  // 3. Load Image Encoder ONNX Model
  if (ort && fs.existsSync(modelPath)) {
    try {
      console.log("[AI Init] Loading MobileCLIP Image Encoder ONNX model...");
      ortSession = await ort.InferenceSession.create(modelPath);
      console.log("[AI Init] MobileCLIP Image Encoder ONNX model loaded successfully.");
    } catch (err) {
      console.error("[AI Init] Failed to initialize Image Encoder ONNX model session:", err);
      isMockMode = true;
    }
  } else {
    console.warn("[AI Init] Image Encoder ONNX model not found or onnxruntime-node missing. Running in Mock mode.");
    isMockMode = true;
  }

  // 4. Load Text Encoder ONNX Model
  if (ort && fs.existsSync(textModelPath)) {
    try {
      console.log("[AI Init] Loading MobileCLIP Text Encoder ONNX model...");
      textEncoderSession = await ort.InferenceSession.create(textModelPath);
      console.log("[AI Init] MobileCLIP Text Encoder ONNX model loaded successfully.");
    } catch (err) {
      console.error("[AI Init] Failed to initialize Text Encoder ONNX model session:", err);
    }
  } else {
    console.warn("[AI Init] Text Encoder ONNX model not found or onnxruntime-node missing. Search will run in mock mode.");
  }
}

// Math: Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    backgroundColor: '#0f172a', // Dark theme background color
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Lifecycles
app.whenReady().then(async () => {
  // Protocol handler for loading local files
  protocol.handle('local', (request) => {
    try {
      const url = new URL(request.url);
      // With local:///D:/path URLs, the full path is in url.pathname
      let filePath = decodeURIComponent(url.pathname);
      // On Windows: remove leading slash if path is like "/D:/photo.jpg"
      if (filePath.startsWith('/') && filePath.length > 2 && filePath[2] === ':') {
        filePath = filePath.slice(1);
      }
      // Normalize slashes to match OS conventions
      filePath = path.normalize(filePath);

      if (!fs.existsSync(filePath)) {
        console.error(`Protocol local load: File not found: ${filePath}`);
        return new Response("Not found", { status: 404 });
      }

      // Read file content
      const buffer = fs.readFileSync(filePath);
      
      // Determine content type
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp'
      };
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      return new Response(buffer, {
        headers: {
          'content-type': contentType,
          'access-control-allow-origin': '*'
        }
      });
    } catch (e) {
      console.error("Protocol local load error:", e);
      return new Response("Error", { status: 500 });
    }
  });

  await initializeAI();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Communication
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  }
  const folderPath = result.filePaths[0];
  try {
    const files = fs.readdirSync(folderPath);
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];
    const images = files
      .filter(file => supportedExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => path.join(folderPath, file));
    
    return { folderPath, images };
  } catch (err) {
    console.error("Failed to read folder directory:", err);
    return { folderPath, images: [] };
  }
});

ipcMain.handle('select-images', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'] }
    ]
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths;
});

ipcMain.handle('classify-photo', async (event, imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    // Mock Mode fallback
    if (isMockMode || !ortSession || !sharp) {
      // Simulate network/disk delay
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
      
      const categories = Object.keys(textEmbeddings);
      // Give random scores that sum to 1.0
      let rawScores = categories.map(() => Math.random() * 0.5 + 0.1);
      // If we want a specific image to always result in a consistent category mock-wise,
      // we can seed it with the sum of char codes of imagePath.
      let seed = 0;
      for (let i = 0; i < imagePath.length; i++) seed += imagePath.charCodeAt(i);
      rawScores = categories.map((cat, idx) => {
        const hash = Math.sin(seed + idx) * 10000;
        return (hash - Math.floor(hash)) * 0.8 + 0.1;
      });

      const sum = rawScores.reduce((a, b) => a + b, 0);
      const scores = categories.map((cat, i) => ({
        category: cat,
        score: rawScores[i] / sum
      }));
      scores.sort((a, b) => b.score - a.score);
      return scores.slice(0, 3);
    }

    // Real inference path
    // 1. Preprocess image with sharp
    // MobileCLIP default input is 256x256
    const { data, info } = await sharp(imagePath)
      .resize(256, 256, {
        fit: 'cover',
        position: 'center'
      })
      .removeAlpha() // Ensure RGB only
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (info.width !== 256 || info.height !== 256 || info.channels !== 3) {
      throw new Error(`Sharp resize output invalid: ${info.width}x${info.height}x${info.channels}`);
    }

    // 2. Reshape to Planar format and scale to [0, 1] (MobileCLIP does not use mean/std standardization)
    const float32Data = new Float32Array(3 * 256 * 256);
    const imageSize = 256 * 256;

    for (let i = 0; i < imageSize; i++) {
      // data holds interleaved R,G,B values. We convert to Planar RRR... GGG... BBB...
      float32Data[i] = data[i * 3] / 255.0;                      // R channel
      float32Data[imageSize + i] = data[i * 3 + 1] / 255.0;      // G channel
      float32Data[2 * imageSize + i] = data[i * 3 + 2] / 255.0;  // B channel
    }

    // 3. Create Tensor [1, 3, 256, 256]
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, 256, 256]);

    // 4. Run ONNX session
    const inputName = ortSession.inputNames[0];
    const feeds = {};
    feeds[inputName] = tensor;
    
    const outputs = await ortSession.run(feeds);
    const outputName = ortSession.outputNames[0];
    const imageEmbedding = outputs[outputName].data; // Float32Array of output dimension (typically 512)

    // Cache the image embedding for search
    imageEmbeddingsCache[imagePath] = imageEmbedding;

    // 5. Calculate similarity with each text embedding
    const similarities = [];
    for (const [category, textEmbedding] of Object.entries(textEmbeddings)) {
      if (textEmbedding && textEmbedding.length > 0) {
        const score = cosineSimilarity(imageEmbedding, textEmbedding);
        similarities.push({ category, score });
      }
    }

    if (similarities.length === 0) {
      return [{ category: "⚠️ No categories defined", score: 1.0 }];
    }

    // 6. Compute Softmax to represent similarity percentages.
    // We multiply similarity scores by a logits temperature (use 60.0 to balance confidence & prevent over-confident low matches)
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

    // Sort descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 3);

  } catch (error) {
    console.error(`Error classifying photo ${imagePath}:`, error);
    return [
      { category: "❌ Error during classification", score: 1.0 },
      { category: error.message || "Unknown error", score: 0.0 }
    ];
  }
});

ipcMain.handle('search-photos', async (event, { queryText, imagePaths }) => {
  try {
    if (!queryText || !imagePaths || imagePaths.length === 0) {
      return [];
    }

    // Mock search logic if running in mock mode or models not loaded
    if (isMockMode || !textEncoderSession || !tokenizer) {
      console.log(`[AI Search] Running search in Mock Mode for query: "${queryText}"`);
      // Simulate small delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const queryLower = queryText.toLowerCase();
      
      const results = imagePaths.map(filePath => {
        const fileName = path.basename(filePath).toLowerCase();
        let score = 0.10 + Math.random() * 0.05; // baseline random low score
        
        // simple keyword matching to simulate semantic match in Mock mode
        if (fileName.includes(queryLower)) {
          score = 0.28 + Math.random() * 0.05;
        } else if (queryLower.split(/\s+/).some(word => word.length > 1 && fileName.includes(word))) {
          score = 0.22 + Math.random() * 0.05;
        }
        
        return { path: filePath, score };
      });
      
      // Sort descending by score
      results.sort((a, b) => b.score - a.score);
      return results;
    }

    // Real search logic using ONNX Text Encoder
    // 1. Tokenize query
    const tokenIds = tokenizer.encodeForCLIP(queryText);
    
    // 2. Convert to BigInt64Array
    const bigintData = new BigInt64Array(77);
    for (let i = 0; i < 77; i++) {
      bigintData[i] = BigInt(tokenIds[i]);
    }
    
    // 3. Create Tensor [1, 77]
    const tensor = new ort.Tensor('int64', bigintData, [1, 77]);
    
    // 4. Run ONNX session
    const feeds = { 'text_tokens': tensor };
    const outputs = await textEncoderSession.run(feeds);
    const textFeatures = outputs['text_features'].data; // Float32Array (512-dim)
    
    // 5. L2 Normalize query embedding
    let norm = 0;
    for (let i = 0; i < textFeatures.length; i++) {
      norm += textFeatures[i] * textFeatures[i];
    }
    norm = Math.sqrt(norm);
    
    const queryEmbedding = new Float32Array(512);
    if (norm > 0) {
      for (let i = 0; i < textFeatures.length; i++) {
        queryEmbedding[i] = textFeatures[i] / norm;
      }
    }

    // 6. Calculate cosine similarity against cached image embeddings
    const results = [];
    for (const imagePath of imagePaths) {
      const imgEmbedding = imageEmbeddingsCache[imagePath];
      if (imgEmbedding) {
        // Compute cosine similarity using the defined helper function
        const score = cosineSimilarity(imgEmbedding, queryEmbedding);
        results.push({ path: imagePath, score });
      } else {
        // If image embedding is not yet cached (pending classification), return default low score
        results.push({ path: imagePath, score: 0.0 });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results;
    
  } catch (error) {
    console.error("Error during photo search:", error);
    return [];
  }
});

