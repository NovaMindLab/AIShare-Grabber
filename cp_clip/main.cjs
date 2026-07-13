const { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

function getPhysicalPath(filePath) {
  return filePath.replace(/\bapp\.asar\b/, 'app.asar.unpacked');
}

let activeDeviceUuid = null;
let activeDeviceDb = null;
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

let exifReader;
try {
  exifReader = require('exif-reader');
} catch (err) {
  console.error("Critical: Failed to load exif-reader.", err);
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

// Download path configuration (persisted in a JSON settings file)
const settingsFilePath = path.join(__dirname, 'app_settings.json');
let customDownloadPath = null;

function loadSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const raw = fs.readFileSync(settingsFilePath, 'utf-8');
      const settings = JSON.parse(raw);
      if (settings.downloadPath && typeof settings.downloadPath === 'string') {
        customDownloadPath = settings.downloadPath;
        console.log('[Settings] Loaded download path:', customDownloadPath);
      }
    }
  } catch (err) {
    console.error('[Settings] Failed to load settings file:', err);
  }
}

function saveSettings() {
  try {
    const settings = { downloadPath: customDownloadPath };
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Settings] Failed to save settings file:', err);
  }
}

// Returns the effective base directory for saving synced full files
// (thumbnails always go to thumbnail_sync under __dirname)
function getEffectiveDownloadBase(deviceUuid, type) {
  if (customDownloadPath) {
    // e.g. D:\MyPhotos\<deviceUuid>\images
    return path.join(customDownloadPath, deviceUuid || 'default', type);
  }
  return path.join(__dirname, 'sync_storage', deviceUuid || 'default', type);
}

// BLE Signaling and chunk transfer state
let bleProcess = null;
let hotspotProcess = null;
let pcSessionId = (1000 + Math.floor(Math.random() * 9000)).toString();
const pendingTransfers = {}; // fileId -> { chunks: [], received: 0, total: 0 }


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
  const physicalModelPath = getPhysicalPath(modelPath);
  if (ort && fs.existsSync(physicalModelPath)) {
    try {
      console.log("[AI Init] Loading MobileCLIP Image Encoder ONNX model from:", physicalModelPath);
      ortSession = await ort.InferenceSession.create(physicalModelPath);
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
  const physicalTextModelPath = getPhysicalPath(textModelPath);
  if (ort && fs.existsSync(physicalTextModelPath)) {
    try {
      console.log("[AI Init] Loading MobileCLIP Text Encoder ONNX model from:", physicalTextModelPath);
      textEncoderSession = await ort.InferenceSession.create(physicalTextModelPath);
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

// Helper to convert GPS rational arrays (Degrees, Minutes, Seconds) to decimal degrees
function convertDMSToDD(dmsArray, ref) {
  if (!dmsArray || dmsArray.length < 3) return null;
  const degrees = dmsArray[0];
  const minutes = dmsArray[1];
  const seconds = dmsArray[2];
  let dd = degrees + (minutes / 60) + (seconds / 3600);
  if (ref === 'S' || ref === 'W') {
    dd = -dd;
  }
  return dd;
}

// Function to extract coordinates from local file
async function extractImageGPS(imagePath) {
  try {
    if (!sharp || !exifReader) return null;
    const metadata = await sharp(imagePath).metadata();
    if (metadata && metadata.exif) {
      const exifData = exifReader(metadata.exif);
      if (exifData && exifData.gps) {
        const lat = convertDMSToDD(exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef);
        const lon = convertDMSToDD(exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef);
        if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    }
  } catch (err) {
    console.warn(`[EXIF] Failed to parse GPS for ${imagePath}:`, err.message);
  }
  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    title: "ShareCLIP",
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0f172a', // Dark theme background color
    frame: false, // Make window frameless
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenu(null);

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
  // Load persisted settings (download path etc.) from disk
  loadSettings();

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
  
  // Start local network UDP discovery
  startUdpDiscoveryService();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (activeDeviceDb) {
    try {
      activeDeviceDb.close();
    } catch (_) {}
  }
  if (hotspotProcess) {
    try {
      hotspotProcess.kill();
    } catch (_) {}
    hotspotProcess = null;
  }
});

// IPC Communication
ipcMain.handle('open-thumbnail-folder', async () => {
  const rootThumbDir = path.join(__dirname, 'thumbnail_sync');
  if (!fs.existsSync(rootThumbDir)) {
    fs.mkdirSync(rootThumbDir, { recursive: true });
  }
  if (activeDeviceUuid) {
    const thumbDir = path.join(rootThumbDir, activeDeviceUuid);
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    shell.openPath(thumbDir);
  } else {
    shell.openPath(rootThumbDir);
  }
  return true;
});

ipcMain.handle('request-album-sync', async () => {
  // Send fileId = -7 signal to Android to trigger album sync
  if (!mainWindow) return false;
  mainWindow.webContents.send('send-control-packet', { fileId: -7 });
  return true;
});

ipcMain.handle('open-album-sync-folder', async () => {
  const uuid = activeDeviceUuid || 'default';
  let albumDir;
  if (customDownloadPath) {
    albumDir = path.join(customDownloadPath, 'album_sync', uuid);
  } else {
    albumDir = path.join(__dirname, 'album_sync', uuid);
  }
  if (!fs.existsSync(albumDir)) {
    fs.mkdirSync(albumDir, { recursive: true });
  }
  shell.openPath(albumDir);
  return true;
});

ipcMain.handle('clean-missing-resources', async () => {
  if (!activeDeviceUuid || !activeDeviceDb) return { count: 0 };
  
  return new Promise((resolve) => {
    activeDeviceDb.all(`SELECT id, path FROM resources WHERE type = 'album_photo'`, (err, rows) => {
      if (err || !rows) {
        resolve({ count: 0 });
        return;
      }
      
      const missingIds = [];
      for (const row of rows) {
        if (row.path && !fs.existsSync(row.path)) {
          missingIds.push(row.id);
        }
      }
      
      if (missingIds.length === 0) {
        resolve({ count: 0 });
        return;
      }
      
      // Delete missing records
      const placeholders = missingIds.map(() => '?').join(',');
      activeDeviceDb.run(`DELETE FROM resources WHERE id IN (${placeholders})`, missingIds, (delErr) => {
        if (delErr) {
          console.error('[Database] Failed to delete missing resources:', delErr);
          resolve({ count: 0 });
        } else {
          console.log(`[Database] Cleaned up ${missingIds.length} missing resources from DB`);
          resolve({ count: missingIds.length });
        }
      });
    });
  });
});



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
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];
    const videoExtensions = ['.mp4', '.mkv', '.mov', '.avi', '.webm'];
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
    const fileExtensions = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.xlsx', '.pptx'];
    const allExtensions = [...imageExtensions, ...videoExtensions, ...audioExtensions, ...fileExtensions];
    
    const allFiles = files
      .filter(file => allExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => path.join(folderPath, file));
    
    return { folderPath, images: allFiles }; // Key remains 'images' for backwards compatibility
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
      { name: 'All Supported Files', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'mp4', 'mkv', 'mov', 'avi', 'webm', 'mp3', 'wav', 'm4a', 'ogg', 'flac', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'xlsx', 'pptx'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'] },
      { name: 'Videos', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm'] },
      { name: 'Audios', extensions: ['mp3', 'wav', 'm4a', 'ogg', 'flac'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'xlsx', 'pptx'] }
    ]
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths;
});

ipcMain.handle('read-image-bytes', async (event, filePath) => {
  try {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    const data = fs.readFileSync(filePath);
    return data;
  } catch (error) {
    console.error("Failed to read image bytes:", error);
    throw error;
  }
});

async function computeEmbeddingInternal(imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`File not found: ${imagePath}`);
  }

  // If already cached, return it
  if (imageEmbeddingsCache[imagePath]) {
    return imageEmbeddingsCache[imagePath];
  }

  // Mock Mode fallback
  if (isMockMode || !ortSession || !sharp) {
    // Simulate network/disk delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
    
    // Return a random 512-dim vector for mock mode
    const mockEmbedding = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      mockEmbedding[i] = Math.random() - 0.5;
    }
    // Normalize mock embedding
    let norm = 0;
    for (let i = 0; i < 512; i++) norm += mockEmbedding[i] * mockEmbedding[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < 512; i++) mockEmbedding[i] /= norm;
    }
    imageEmbeddingsCache[imagePath] = mockEmbedding;
    return mockEmbedding;
  }

  // Real inference path
  // 1. Preprocess image with sharp
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

  // 2. Reshape to Planar format and scale to [0, 1]
  const float32Data = new Float32Array(3 * 256 * 256);
  const imageSize = 256 * 256;

  for (let i = 0; i < imageSize; i++) {
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
  // Clone the Float32Array to prevent it from being overwritten by subsequent ONNX runs sharing the same memory allocator
  const imageEmbedding = new Float32Array(outputs[outputName].data);

  // Cache the image embedding
  imageEmbeddingsCache[imagePath] = imageEmbedding;
  return imageEmbedding;
}

async function classifyPhotoInternal(imagePath) {
  try {
    const imageEmbedding = await computeEmbeddingInternal(imagePath);

    // Mock Mode fallback
    if (isMockMode || !ortSession || !sharp) {
      const categories = Object.keys(textEmbeddings);
      let seed = 0;
      for (let i = 0; i < imagePath.length; i++) seed += imagePath.charCodeAt(i);
      let rawScores = categories.map((cat, idx) => {
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

    // Real inference path label mapping
    // Calculate similarity with each text embedding
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
}

ipcMain.handle('classify-photo', async (event, imagePath) => {
  const predictions = await classifyPhotoInternal(imagePath);
  const gps = await extractImageGPS(imagePath);
  return {
    predictions,
    latitude: gps ? gps.latitude : null,
    longitude: gps ? gps.longitude : null
  };
});

ipcMain.handle('reclassify-all-phone-photos', async (event) => {
  if (!activeDeviceUuid || !activeDeviceDb) {
    throw new Error("No active device database connected");
  }

  // 1. Get all photos and thumbnails
  const rows = await new Promise((resolve, reject) => {
    activeDeviceDb.all(
      `SELECT id, name, path, type, size FROM resources WHERE type = 'images' OR type = 'thumbnail'`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  const total = rows.length;
  console.log(`[AI Reclassify] Found ${total} phone photos to reclassify.`);

  // 2. Loop and reclassify
  for (let i = 0; i < total; i++) {
    const row = rows[i];
    
    // Notify renderer of progress
    event.sender.send('reclassify-progress', {
      done: i,
      total,
      currentName: row.name
    });

    try {
      if (fs.existsSync(row.path)) {
        const predictions = await classifyPhotoInternal(row.path);
        const predictionsStr = JSON.stringify(predictions);

        // Get the cached embedding Buffer
        let embeddingBuffer = null;
        const emb = imageEmbeddingsCache[row.path];
        if (emb) {
          embeddingBuffer = Buffer.from(emb.buffer, emb.byteOffset, emb.byteLength);
        }

        // Update database with both predictions and embedding blob
        await new Promise((resolve, reject) => {
          activeDeviceDb.run(
            `UPDATE resources SET predictions = ?, embedding = ? WHERE id = ?`,
            [predictionsStr, embeddingBuffer, row.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // Send a single image update event to the renderer immediately!
        event.sender.send('single-photo-predictions-updated', {
          id: row.id,
          predictions
        });
      }
    } catch (err) {
      console.error(`[AI Reclassify] Failed for ${row.name}:`, err);
    }
  }

  // Final progress notification
  event.sender.send('reclassify-progress', {
    done: total,
    total,
    currentName: 'Completed'
  });

  // 3. Query all updated resources to return
  const updatedRows = await new Promise((resolve, reject) => {
    activeDeviceDb.all(
      `SELECT id, name, path, type, size, predictions, latitude, longitude FROM resources`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  return updatedRows;
});

ipcMain.handle('get-similar-images-groups', async (event, { imageList, threshold }) => {
  const total = imageList.length;
  console.log(`[AI Similar] Starting similarity analysis on ${total} images with threshold ${threshold}`);

  // 1. Ensure all image embeddings are cached
  const embeddings = [];
  const validImages = [];

  // 1. Ensure all image embeddings are cached (using bounded concurrency limit of 4)
  const concurrencyLimit = 4;
  let doneCount = 0;

  async function processImage(img) {
    try {
      let emb = imageEmbeddingsCache[img.path];
      if (!emb && fs.existsSync(img.path)) {
        emb = await computeEmbeddingInternal(img.path);
        
        // Background persist to database if it's a mobile synced image
        if (activeDeviceDb && img.id) {
          const embBuf = Buffer.from(emb.buffer, emb.byteOffset, emb.byteLength);
          activeDeviceDb.run(
            `UPDATE resources SET embedding = ? WHERE id = ? OR path = ?`,
            [embBuf, img.id, img.path]
          );
        }
      }

      // Update progress
      doneCount++;
      event.sender.send('similar-progress', {
        done: doneCount,
        total,
        currentName: img.name
      });

      return { img, emb };
    } catch (err) {
      console.error(`[AI Similar] Failed to process embedding for ${img.name}:`, err);
      doneCount++;
      event.sender.send('similar-progress', {
        done: doneCount,
        total,
        currentName: img.name
      });
      return { img, emb: null };
    }
  }

  // Run in a bounded concurrency execution pool
  const results = [];
  const executing = new Set();

  for (const img of imageList) {
    const p = processImage(img).then(res => {
      executing.delete(p);
      return res;
    });
    results.push(p);
    executing.add(p);
    
    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  const processed = await Promise.all(results);

  for (const item of processed) {
    if (item.emb) {
      embeddings.push(item.emb);
      validImages.push(item.img);
    }
  }

  event.sender.send('similar-progress', {
    done: total,
    total,
    currentName: 'Comparing similarities...'
  });

  const n = validImages.length;
  const clusterGroups = []; // Array of arrays: [ [idx0, idx1...], [idx2...] ]

  // 2. Perform Leader (Centroid) Clustering to prevent the Chaining Effect
  for (let i = 0; i < n; i++) {
    const embI = embeddings[i];
    let bestGroupIdx = -1;
    let bestSim = -1;

    for (let g = 0; g < clusterGroups.length; g++) {
      const leaderIdx = clusterGroups[g][0];
      const sim = cosineSimilarity(embI, embeddings[leaderIdx]);
      if (sim > bestSim) {
        bestSim = sim;
        bestGroupIdx = g;
      }
    }

    if (bestSim >= threshold) {
      clusterGroups[bestGroupIdx].push(i);
    } else {
      clusterGroups.push([i]);
    }
  }

  // Filter groups to only include those with at least 2 images
  const groups = [];
  for (const group of clusterGroups) {
    if (group.length >= 2) {
      const groupImages = group.map(idx => {
        const img = validImages[idx];
        
        // Find maximum similarity with any other item in this group (to display similarity value)
        let maxSim = 0;
        const embIdx = embeddings[idx];
        for (const otherIdx of group) {
          if (otherIdx !== idx) {
            const sim = cosineSimilarity(embIdx, embeddings[otherIdx]);
            if (sim > maxSim) maxSim = sim;
          }
        }

        return {
          ...img,
          maxSimWithGroup: maxSim
        };
      });

      // Sort images inside group by size descending (helps user identify larger duplicate files to delete)
      groupImages.sort((a, b) => (b.size || 0) - (a.size || 0));

      groups.push({
        images: groupImages
      });
    }
  }

  // Final progress notification
  event.sender.send('similar-progress', {
    done: total,
    total,
    currentName: 'Completed'
  });

  console.log(`[AI Similar] Found ${groups.length} groups of similar images.`);
  return groups;
});

ipcMain.handle('delete-files', async (event, files) => {
  console.log(`[Database/FS] Request to delete ${files.length} files.`);
  
  for (const file of files) {
    // 1. Delete from filesystem
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`[FS] Deleted file: ${file.path}`);
      }
    } catch (err) {
      console.error(`[FS] Failed to delete file at ${file.path}:`, err);
    }

    // 2. Delete from database
    if (activeDeviceDb) {
      await new Promise((resolve, reject) => {
        activeDeviceDb.run(
          `DELETE FROM resources WHERE id = ? OR path = ?`,
          [file.id, file.path],
          (err) => {
            if (err) {
              console.error(`[Database] Failed to delete resource ${file.id}:`, err);
              resolve(); // continue anyway
            } else {
              console.log(`[Database] Deleted resource record: ${file.id}`);
              resolve();
            }
          }
        );
      });
    }
  }

  // 3. Return updated list of resources
  if (activeDeviceDb) {
    const updatedRows = await new Promise((resolve, reject) => {
      activeDeviceDb.all(
        `SELECT id, name, path, type, size, predictions, latitude, longitude FROM resources`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
    return updatedRows;
  }
  
  return [];
});

// BLE Signaling and WebRTC synchronization handlers
ipcMain.handle('start-ble-server', async (event) => {
  if (bleProcess) {
    console.log("[Main] BLE process already running, killing first.");
    bleProcess.kill();
    bleProcess = null;
  }
  
  const service_uuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  const char_uuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
  
  const { spawn } = require('child_process');
  const fs = require('fs');
  const exePath = path.join(__dirname, 'ble_signaling_server.exe');
  const physicalExePath = getPhysicalPath(exePath);
  const physicalCwd = getPhysicalPath(__dirname);
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(physicalExePath)) {
      return reject(new Error("BLE Helper executable 'ble_signaling_server.exe' not found. Please compile it first."));
    }
    
    console.log("[Main] Spawning compiled BLE helper from unpacked path:", physicalExePath);
    bleProcess = spawn(physicalExePath, [service_uuid, char_uuid, pcSessionId], {
      cwd: physicalCwd
    });
    
    let resolved = false;
    let macAddress = null;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error("BLE GATT Server startup timeout"));
      }
    }, 10000);
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: bleProcess.stdout,
      terminal: false
    });
    
    rl.on('line', (line) => {
      console.log(`[BLE Helper Stdout]: ${line}`);
      if (mainWindow) {
        if (line.startsWith("SDP:OFFER:")) {
          mainWindow.webContents.send('sync-log', `[BLE] Received SDP Offer (Length: ${line.length - 10}B)`);
        } else if (line.startsWith("ICE:")) {
          mainWindow.webContents.send('sync-log', `[BLE] Received remote ICE Candidate`);
        } else if (line.startsWith("PHONE_LOG:")) {
          mainWindow.webContents.send('sync-log', `[Phone] ${line.substring(10)}`);
        } else {
          mainWindow.webContents.send('sync-log', `[BLE] ${line}`);
        }
      }

      if (line.startsWith("MAC:")) {
        macAddress = line.substring(4).trim();
      } else if (line.startsWith("STATUS:ADVERTISING")) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({
            ble_mac: macAddress,
            service_uuid,
            char_uuid,
            session_id: pcSessionId
          });
        }
      } else if (line === "STATUS:CONNECTED") {
        if (mainWindow) {
          mainWindow.webContents.send('ble-status-changed', 'connected');
        }
      } else if (line.startsWith("SDP:OFFER:")) {
        const offerEscaped = line.substring(10);
        const offerSdp = offerEscaped.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
        if (mainWindow) {
          mainWindow.webContents.send('ble-offer-received', offerSdp);
        }
      } else if (line.startsWith("ICE:")) {
        const parts = line.substring(4).split(":", 2);
        if (parts.length >= 2) {
          const sdpMid = parts[0];
          const sdpMLineIndex = parseInt(parts[1], 10);
          const prefix = `ICE:${sdpMid}:${sdpMLineIndex}:`;
          const candidate = line.substring(4 + prefix.length);
          if (mainWindow) {
            mainWindow.webContents.send('ble-ice-received', { sdpMid, sdpMLineIndex, candidate });
          }
        }
      }
    });
    
    bleProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.error(`[BLE Helper Stderr]: ${msg}`);
      if (mainWindow && msg) {
        // Filter out debug/warning noise if needed, or send everything
        mainWindow.webContents.send('sync-log', `[BLE Debug/Err] ${msg}`);
      }
    });
    
    bleProcess.on('close', (code) => {
      console.log(`[BLE Helper] Exited with code ${code}`);
      bleProcess = null;
      if (mainWindow) {
        mainWindow.webContents.send('ble-status-changed', 'disconnected');
      }
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`BLE Helper process exited with code ${code}`));
      }
    });
    
    bleProcess.on('error', (err) => {
      console.error("[BLE Helper] Process error:", err);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
});

ipcMain.handle('stop-ble-server', async () => {
  if (bleProcess) {
    bleProcess.kill();
    bleProcess = null;
    return true;
  }
  return false;
});

ipcMain.handle('start-hotspot', async (event, { ssid, password }) => {
  if (hotspotProcess) {
    try {
      hotspotProcess.kill();
    } catch (_) {}
    hotspotProcess = null;
  }

  const { spawn } = require('child_process');
  const scriptPath = path.join(__dirname, 'wifi_ap.ps1');
  const physicalScriptPath = getPhysicalPath(scriptPath);
  const physicalCwd = getPhysicalPath(__dirname);

  return new Promise((resolve, reject) => {
    // Spawn PowerShell executing our multi-fallback script from unpacked path
    hotspotProcess = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-File', physicalScriptPath,
      '-SSID', ssid,
      '-Password', password
    ], {
      cwd: physicalCwd
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error("Wi-Fi Hotspot startup timeout"));
      }
    }, 15000);

    const readline = require('readline');
    const rl = readline.createInterface({
      input: hotspotProcess.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      console.log(`[Hotspot Stdout]: ${line}`);
      if (mainWindow) {
        mainWindow.webContents.send('sync-log', `[Hotspot] ${line}`);
      }

      if (line.startsWith("STATUS: STARTED")) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ status: 'started', ssid, password });
        }
      } else if (line.startsWith("STATUS: FAILED")) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error("All hotspot methods failed."));
        }
      }
    });

    hotspotProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.error(`[Hotspot Stderr]: ${msg}`);
      if (mainWindow && msg) {
        mainWindow.webContents.send('sync-log', `[Hotspot Error] ${msg}`);
      }
    });

    hotspotProcess.on('close', (code) => {
      console.log(`[Hotspot] Process closed with code ${code}`);
      if (mainWindow) {
        mainWindow.webContents.send('hotspot-status-changed', 'stopped');
      }
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Hotspot process exited with code ${code}`));
      }
    });
  });
});

ipcMain.handle('stop-hotspot', async () => {
  if (hotspotProcess) {
    try {
      hotspotProcess.kill();
    } catch (_) {}
    hotspotProcess = null;
    return true;
  }
  return false;
});

ipcMain.handle('send-answer-sdp', async (event, sdp) => {
  if (bleProcess && bleProcess.stdin) {
    const escapedSdp = sdp.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
    bleProcess.stdin.write(`ANSWER:${escapedSdp}\n`);
    return true;
  }
  return false;
});

ipcMain.handle('send-ice-candidate', async (event, { sdpMid, sdpMLineIndex, candidate }) => {
  if (bleProcess && bleProcess.stdin) {
    bleProcess.stdin.write(`ICE:${sdpMid}:${sdpMLineIndex}:${candidate}\n`);
    return true;
  }
  return false;
});

ipcMain.handle('init-device-sync', async (event, { deviceUuid, deviceName }) => {
  activeDeviceUuid = deviceUuid;
  
  const baseDir = path.join(__dirname, 'sync_storage', deviceUuid);
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Create folders for sub-resources
  const dirs = ['images', 'videos', 'audios', 'files'];
  for (const d of dirs) {
    const subpath = path.join(baseDir, d);
    if (!fs.existsSync(subpath)) {
      fs.mkdirSync(subpath, { recursive: true });
    }
  }
  
  // Close old database connection if any
  if (activeDeviceDb) {
    try {
      activeDeviceDb.close();
    } catch (_) {}
  }
  
  // Open SQLite database file for this device
  const dbPath = path.join(baseDir, 'database.sqlite');
  activeDeviceDb = new sqlite3.Database(dbPath);
  
  // Initialize table (including embedding BLOB column)
  await new Promise((resolve, reject) => {
    activeDeviceDb.run(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        name TEXT,
        path TEXT,
        type TEXT,
        size INTEGER,
        predictions TEXT,
        sync_time INTEGER,
        embedding BLOB
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Safe schema upgrade: ALTER TABLE to add embedding if it's missing from previous versions
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN embedding BLOB`, () => {
      resolve(); // ignore error if column already exists
    });
  });

  // Safe schema upgrade: ALTER TABLE to add latitude and longitude if they are missing
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN latitude REAL`, () => {
      resolve();
    });
  });
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN longitude REAL`, () => {
      resolve();
    });
  });
  // Safe schema upgrade: add create_date column for album sync breakpoint tracking
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN create_date TEXT`, () => {
      resolve(); // ignore error if already exists
    });
  });
  
  // Read and return already synced assets
  const syncInfo = await new Promise((resolve, reject) => {
    activeDeviceDb.all(`SELECT id, name, path, type, size, predictions, embedding, latitude, longitude, create_date FROM resources`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const syncedIds = rows.map(r => r.id);
        
        // Populated cached embeddings directly from SQLite into memory for instantaneous similarity calculations!
        for (const row of rows) {
          if (row.embedding && row.path) {
            try {
              const buffer = row.embedding; // Node.js Buffer from sqlite3 BLOB
              const floatArray = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
              imageEmbeddingsCache[row.path] = Float32Array.from(floatArray); // safe clone
            } catch (loadErr) {
              console.error(`[Database] Failed to load embedding from DB for ${row.path}:`, loadErr);
            }
          }
        }

        // Find the most recent create_date among album_photo records for breakpoint resume
        let lastAlbumSyncDate = '';
        const albumRows = rows.filter(r => r.type === 'album_photo' && r.create_date);
        if (albumRows.length > 0) {
          const sorted = albumRows.sort((a, b) => (a.create_date > b.create_date ? 1 : -1));
          lastAlbumSyncDate = sorted[sorted.length - 1].create_date;
        }
        
        resolve({ syncedIds, resources: rows, lastAlbumSyncDate });
      }
    });
  });
  
  console.log(`[Database] Initialized for device: ${deviceName} (${deviceUuid}). Loaded ${syncInfo.syncedIds.length} synced assets. Last album sync: ${syncInfo.lastAlbumSyncDate || 'none'}`);
  return syncInfo;
});

ipcMain.handle('clear-device-database', async (event) => {
  if (!activeDeviceDb) {
    console.log('[Database] clear-device-database failed: no active device database.');
    return false;
  }
  
  try {
    // 1. Delete all records from resources table
    await new Promise((resolve, reject) => {
      activeDeviceDb.run(`DELETE FROM resources`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 2. Clear cached embeddings that belong to active device path
    if (activeDeviceUuid) {
      Object.keys(imageEmbeddingsCache).forEach(key => {
        if (key.includes(activeDeviceUuid)) {
          delete imageEmbeddingsCache[key];
        }
      });
      
      // 3. Remove physical files under sync_storage and thumbnail_sync for this device
      const thumbDir = path.join(__dirname, 'thumbnail_sync', activeDeviceUuid);
      const syncDir = path.join(__dirname, 'sync_storage', activeDeviceUuid);
      
      const fs = require('fs');
      if (fs.existsSync(thumbDir)) {
        try {
          fs.rmSync(thumbDir, { recursive: true, force: true });
        } catch (err) {
          console.error(`[Database] Failed to delete thumbnail directory ${thumbDir}:`, err);
        }
      }
      if (fs.existsSync(syncDir)) {
        try {
          fs.rmSync(syncDir, { recursive: true, force: true });
        } catch (err) {
          console.error(`[Database] Failed to delete sync storage directory ${syncDir}:`, err);
        }
      }
    }
    
    console.log('[Database] Cleared all resource records and cache files successfully.');
    return true;
  } catch (err) {
    console.error('[Database] Failed to clear device database:', err);
    return false;
  }
});

// ---- Download path settings ---------------------------------------------------

ipcMain.handle('get-download-path', () => {
  return customDownloadPath || null;
});

ipcMain.handle('set-download-path', (event, newPath) => {
  if (newPath && typeof newPath === 'string') {
    customDownloadPath = newPath;
  } else {
    customDownloadPath = null;
  }
  saveSettings();
  console.log('[Settings] Download path updated to:', customDownloadPath);
  return customDownloadPath;
});

ipcMain.handle('select-download-folder', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择下载保存目录',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: '选择此目录'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const selectedPath = result.filePaths[0];
  customDownloadPath = selectedPath;
  saveSettings();
  console.log('[Settings] Download path selected:', customDownloadPath);
  return customDownloadPath;
});

ipcMain.handle('open-download-folder', async (event) => {
  const folderToOpen = customDownloadPath || path.join(__dirname, 'sync_storage');
  if (!fs.existsSync(folderToOpen)) {
    fs.mkdirSync(folderToOpen, { recursive: true });
  }
  shell.openPath(folderToOpen);
  return true;
});

// ---- Check for Updates --------------------------------------------------------

function isNewVersionAvailable(current, latest) {
  const cleanCurrent = current.replace(/^v/, '').split('+')[0];
  const cleanLatest = latest.replace(/^v/, '').split('+')[0];
  
  const currentParts = cleanCurrent.split('.').map(x => parseInt(x, 10));
  const latestParts = cleanLatest.split('.').map(x => parseInt(x, 10));
  
  for (let i = 0; i < 3; i++) {
    const currentVal = currentParts[i] || 0;
    const latestVal = latestParts[i] || 0;
    if (latestVal > currentVal) return true;
    if (currentVal > latestVal) return false;
  }
  return false;
}

const https = require('https');

function downloadFile(url, destPath, progressCallback) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      https.get(targetUrl, {
        headers: { 'User-Agent': 'ShareCLIP-PC-App' }
      }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          request(res.headers.location);
          return;
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: status code ${res.statusCode}`));
          return;
        }
        
        const totalBytes = parseInt(res.headers['content-length'], 10);
        let downloadedBytes = 0;
        const fileStream = fs.createWriteStream(destPath);
        
        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          fileStream.write(chunk);
          if (totalBytes > 0) {
            const progress = Math.round((downloadedBytes / totalBytes) * 100);
            progressCallback(progress);
          }
        });
        
        res.on('end', () => {
          fileStream.end();
          resolve();
        });
        
        res.on('error', (err) => {
          fileStream.end();
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    };
    
    request(url);
  });
}

ipcMain.handle('check-for-updates', async () => {
  try {
    const response = await fetch('https://api.github.com/repos/NovaMindLab/AIShare-Grabber/releases/latest', {
      headers: {
        'User-Agent': 'ShareCLIP-PC-App'
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }
    const release = await response.json();
    const latestVersion = release.tag_name;
    const currentVersion = app.getVersion();
    
    const available = isNewVersionAvailable(currentVersion, latestVersion);
    
    let downloadUrl = null;
    if (release.assets && Array.isArray(release.assets)) {
      let asset = release.assets.find(a => a.name && a.name.includes('Setup') && a.name.endsWith('.exe'));
      if (!asset) {
        asset = release.assets.find(a => a.name && a.name.endsWith('.exe'));
      }
      if (asset) {
        downloadUrl = asset.browser_download_url;
      }
    }
    
    return {
      available,
      currentVersion,
      latestVersion,
      url: release.html_url,
      downloadUrl,
      body: release.body
    };
  } catch (err) {
    console.error('[Update Check] Failed to check for updates:', err.message);
    return {
      available: false,
      error: err.message
    };
  }
});

ipcMain.handle('start-update-download', async (event, downloadUrl) => {
  try {
    const tempDir = app.getPath('temp');
    const tempFilePath = path.join(tempDir, 'ShareCLIP_Setup_Update.exe');
    
    console.log(`[Update Download] Starting download from ${downloadUrl} to ${tempFilePath}`);
    
    await downloadFile(downloadUrl, tempFilePath, (progress) => {
      event.sender.send('update-download-progress', progress);
    });
    
    console.log('[Update Download] Download completed successfully.');
    return { success: true, filePath: tempFilePath };
  } catch (err) {
    console.error('[Update Download] Error downloading update:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-update', async (event, filePath) => {
  try {
    console.log(`[Update Install] Spawning installer: ${filePath}`);
    const { spawn } = require('child_process');
    
    const child = spawn(filePath, [], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    
    console.log('[Update Install] Quitting parent Electron app...');
    app.quit();
    return { success: true };
  } catch (err) {
    console.error('[Update Install] Error installing update:', err.message);
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------------------------

ipcMain.handle('save-full-photo', async (event, { fileId, payload, metadata }) => {
  const fullBuffer = Buffer.from(payload);
  
  // Resolve filename, type, and target path
  const ext = getExtension(fullBuffer);
  
  let filename = '';
  let assetId = '';
  
  if (metadata && metadata.name) {
    filename = metadata.name;
    assetId = metadata.assetId || filename;
  } else {
    filename = `synced_${Date.now()}_${fileId}${ext}`;
    assetId = filename;
  }
  
  let type = 'files';
  if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'].includes(ext.toLowerCase())) {
    type = 'images';
  } else if (['.mp4', '.mkv', '.mov', '.avi', '.webm'].includes(ext.toLowerCase())) {
    type = 'videos';
  } else if (['.mp3', '.wav', '.m4a', '.ogg', '.flac'].includes(ext.toLowerCase())) {
    type = 'audios';
  }
  
  const isThumbnail = filename.startsWith('thumb_') && ext.toLowerCase() === '.jpg';
  const isAlbumPhoto = filename.startsWith('album_');
  
  let targetPath = '';
  if (isThumbnail) {
    // Thumbnails always stored in __dirname/thumbnail_sync/<uuid>/
    const targetDir = path.join(__dirname, 'thumbnail_sync', activeDeviceUuid || 'default');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    targetPath = path.join(targetDir, filename);
  } else if (isAlbumPhoto) {
    // Album photos stored under album_sync/<uuid>/<YYYY-MM-DD>/ for date-based organization
    const createDateStr = metadata && metadata.create_date ? metadata.create_date : new Date().toISOString();
    const dateFolderName = createDateStr.substring(0, 10); // 'YYYY-MM-DD'
    const baseDir = customDownloadPath
      ? path.join(customDownloadPath, 'album_sync', activeDeviceUuid || 'default', dateFolderName)
      : path.join(__dirname, 'album_sync', activeDeviceUuid || 'default', dateFolderName);
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    targetPath = path.join(baseDir, filename);
  } else if (activeDeviceUuid) {
    // Full files go to user-configured download path (or default sync_storage)
    const targetDir = getEffectiveDownloadBase(activeDeviceUuid, type);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    targetPath = path.join(targetDir, filename);
  } else {
    const aiimageDir = path.join(__dirname, 'aiimage');
    if (!fs.existsSync(aiimageDir)) {
      fs.mkdirSync(aiimageDir, { recursive: true });
    }
    targetPath = path.join(aiimageDir, filename);
  }
  
  fs.writeFileSync(targetPath, fullBuffer);
  console.log(`[Sync] Saved reassembled file to ${targetPath}`);
  
  // Auto classify only if it is an image or thumbnail (not album originals to keep it fast)
  let predictions = [];
  if ((type === 'images' || isThumbnail) && !isAlbumPhoto) {
    try {
      predictions = await classifyPhotoInternal(targetPath);
    } catch (err) {
      console.error(`Auto classification failed for ${targetPath}:`, err);
    }
  }
  
  // Register record in SQLite database if device is connected
  if (activeDeviceUuid && activeDeviceDb) {
    const size = fullBuffer.length;
    const predictionsStr = JSON.stringify(predictions);
    const syncTime = Date.now();
    const createDate = metadata && metadata.create_date ? metadata.create_date : null;
    
    // Get the cached embedding Buffer
    let embeddingBuffer = null;
    const emb = imageEmbeddingsCache[targetPath];
    if (emb) {
      embeddingBuffer = Buffer.from(emb.buffer, emb.byteOffset, emb.byteLength);
    }

    activeDeviceDb.run(`
      INSERT OR REPLACE INTO resources (id, name, path, type, size, predictions, sync_time, embedding, latitude, longitude, create_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      assetId, 
      filename, 
      targetPath, 
      isAlbumPhoto ? 'album_photo' : (isThumbnail ? 'thumbnail' : type), 
      size, 
      predictionsStr, 
      syncTime, 
      embeddingBuffer,
      metadata && metadata.latitude !== undefined ? metadata.latitude : null,
      metadata && metadata.longitude !== undefined ? metadata.longitude : null,
      createDate
    ], (err) => {
      if (err) {
        console.error(`[Database] Error registering synced asset ${assetId}:`, err);
      } else {
        console.log(`[Database] Registered synced asset: ${filename} (ID: ${assetId}, type: ${isAlbumPhoto ? 'album_photo' : (isThumbnail ? 'thumbnail' : type)})`);
      }
    });
  }
  
  // Notify renderer that a new file is synced!
  if (mainWindow) {
    mainWindow.webContents.send('photo-synced', {
      isThumbnail,
      path: targetPath,
      name: filename,
      src: `local:///${targetPath.replace(/\\/g, '/')}`,
      predictions,
      latitude: metadata && metadata.latitude !== undefined ? metadata.latitude : null,
      longitude: metadata && metadata.longitude !== undefined ? metadata.longitude : null
    });
  }
  
  return true;
});

function getExtension(buffer) {
  if (buffer.length >= 4) {
    // 1. Image Formats
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return '.png';
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return '.jpg';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return '.gif';
    }
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return '.webp';
    }
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE') {
      return '.wav';
    }
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'AVI ') {
      return '.avi';
    }

    // 2. Document/Archive Formats
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return '.pdf';
    }
    if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return '.zip';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x61 && buffer[2] === 0x72 && buffer[3] === 0x21) {
      return '.rar';
    }
    if (buffer[0] === 0x37 && buffer[1] === 0x7A && buffer[2] === 0xBC && buffer[3] === 0xAF) {
      return '.7z';
    }

    // 3. Audio Formats
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return '.mp3';
    }
    if (buffer[0] === 0xFF && (buffer[1] === 0xFB || buffer[1] === 0xF3 || buffer[1] === 0xF2)) {
      return '.mp3';
    }
    if (buffer[0] === 0x66 && buffer[1] === 0x4C && buffer[2] === 0x61 && buffer[3] === 0x43) {
      return '.flac';
    }

    // 4. Video Formats
    if (buffer.toString('ascii', 4, 8) === 'ftyp') {
      return '.mp4';
    }
    if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
      return '.mkv';
    }
  }
  return '.bin';
}

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

// ─────────────────────────────────────────────────────────────────
// 📶 UDP DISCOVERY & DIRECT CONNECTION SERVICES
// ─────────────────────────────────────────────────────────────────
const dgram = require('dgram');
let udpSocket = null;
const discoveredDevices = new Map(); // uuid -> { uuid, name, ip, type, lastSeen, sessionId }

let computerUuid = null;
function getComputerUuid() {
  if (computerUuid) return computerUuid;
  const fs = require('fs');
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (data.computerUuid) {
        computerUuid = data.computerUuid;
        return computerUuid;
      }
    }
  } catch (_) {}
  
  computerUuid = 'pc-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  try {
    fs.writeFileSync(settingsPath, JSON.stringify({ computerUuid }), 'utf8');
  } catch (_) {}
  return computerUuid;
}

function startUdpDiscoveryService() {
  if (udpSocket) return;

  udpSocket = dgram.createSocket('udp4');

  udpSocket.on('error', (err) => {
    console.error(`[UDP Error]: ${err.stack}`);
    try { udpSocket.close(); } catch (_) {}
    udpSocket = null;
  });

  udpSocket.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'ShareCLIP_Discovery') {
        if (data.device_uuid === getComputerUuid()) return;

        discoveredDevices.set(data.device_uuid, {
          uuid: data.device_uuid,
          name: data.device_name,
          ip: rinfo.address,
          type: data.device_type || 'PC',
          lastSeen: Date.now(),
          sessionId: data.session_id
        });
        
        notifyDiscoveredDevices();
      } else if (data.type === 'ShareCLIP_Connect_Request') {
        if (mainWindow) {
          mainWindow.webContents.send('connection-request', {
            uuid: data.from_uuid,
            name: data.from_name,
            ip: rinfo.address
          });
        }
      } else if (data.type === 'ShareCLIP_Connect_Response') {
        if (mainWindow) {
          mainWindow.webContents.send('connection-response', {
            ip: rinfo.address,
            accept: data.accept,
            sdp: data.sdp
          });
        }
      } else if (data.type === 'ShareCLIP_Direct_Sdp') {
        if (mainWindow) {
          mainWindow.webContents.send('direct-sdp-received', {
            ip: rinfo.address,
            sdp: data.sdp,
            sdpType: data.sdpType
          });
        }
      } else if (data.type === 'ShareCLIP_Direct_Ice') {
        if (mainWindow) {
          mainWindow.webContents.send('direct-ice-received', {
            ip: rinfo.address,
            candidate: data.candidate
          });
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  });

  udpSocket.on('listening', () => {
    try {
      udpSocket.setBroadcast(true);
    } catch (e) {
      console.error("[UDP] Failed to set broadcast:", e);
    }
    const address = udpSocket.address();
    console.log(`[UDP Service] Listening on ${address.address}:${address.port}`);
  });

  try {
    udpSocket.bind(15185);
  } catch (e) {
    console.error("[UDP] Bind failed:", e);
  }

  // Start timers
  setInterval(broadcastDiscovery, 3000);
  setInterval(pruneDiscoveryList, 5000);
}

function broadcastDiscovery() {
  if (!udpSocket) return;

  const hostname = require('os').hostname();
  const payload = JSON.stringify({
    type: 'ShareCLIP_Discovery',
    device_uuid: getComputerUuid(),
    device_name: hostname,
    device_type: 'PC',
    session_id: pcSessionId
  });

  const message = Buffer.from(payload);
  try {
    udpSocket.send(message, 0, message.length, 15185, '255.255.255.255', (err) => {
      if (err) {
        // Suppress broadcast network-unreachable warnings
      }
    });
  } catch (e) {
    // Suppress network errors
  }
}

function pruneDiscoveryList() {
  const now = Date.now();
  let changed = false;
  for (const [uuid, device] of discoveredDevices.entries()) {
    if (now - device.lastSeen > 10000) {
      discoveredDevices.delete(uuid);
      changed = true;
    }
  }
  if (changed) {
    notifyDiscoveredDevices();
  }
}

function notifyDiscoveredDevices() {
  if (mainWindow) {
    const list = Array.from(discoveredDevices.values());
    mainWindow.webContents.send('discovered-devices', list);
  }
}

// IPC Handlers for UDP P2P Discovery & WebRTC signaling
ipcMain.handle('send-udp-connect-request', async (event, { ip }) => {
  if (!udpSocket) return false;
  const hostname = require('os').hostname();
  const payload = JSON.stringify({
    type: 'ShareCLIP_Connect_Request',
    from_uuid: getComputerUuid(),
    from_name: hostname
  });
  const message = Buffer.from(payload);
  return new Promise((resolve) => {
    udpSocket.send(message, 0, message.length, 15185, ip, (err) => {
      resolve(!err);
    });
  });
});

ipcMain.handle('respond-to-connection-request', async (event, { ip, accept }) => {
  if (!udpSocket) return false;
  const payload = JSON.stringify({
    type: 'ShareCLIP_Connect_Response',
    accept: accept
  });
  const message = Buffer.from(payload);
  return new Promise((resolve) => {
    udpSocket.send(message, 0, message.length, 15185, ip, (err) => {
      resolve(!err);
    });
  });
});

ipcMain.handle('send-udp-sdp', async (event, { ip, sdp, sdpType }) => {
  if (!udpSocket) return false;
  const payload = JSON.stringify({
    type: 'ShareCLIP_Direct_Sdp',
    sdp: sdp,
    sdpType: sdpType
  });
  const message = Buffer.from(payload);
  return new Promise((resolve) => {
    udpSocket.send(message, 0, message.length, 15185, ip, (err) => {
      resolve(!err);
    });
  });
});

ipcMain.handle('send-udp-ice', async (event, { ip, candidate }) => {
  if (!udpSocket) return false;
  const payload = JSON.stringify({
    type: 'ShareCLIP_Direct_Ice',
    candidate: candidate
  });
  const message = Buffer.from(payload);
  return new Promise((resolve) => {
    udpSocket.send(message, 0, message.length, 15185, ip, (err) => {
      resolve(!err);
    });
  });
});

// Window controls
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

