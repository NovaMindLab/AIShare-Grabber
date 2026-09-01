const { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Force Electron to use "ShareCLIP" as product name and AppData folder
try {
  app.setName('ShareCLIP');
  const customUserData = path.join(app.getPath('appData'), 'ShareCLIP');
  app.setPath('userData', customUserData);
  // Force WebRTC to gather actual IPv4 host candidates instead of .local mDNS hostnames
  app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');
} catch (e) {}

// -------------------------------------------------------------------------------
// 📄 Local Persistent File Logger & Exception Protection
// Writes all console outputs, connection events, and uncaught crash tracebacks
// to %AppData%\ShareCLIP\logs\shareclip_YYYY-MM-DD.log for PC crash diagnosis.
// -------------------------------------------------------------------------------
let logDir = '';
let logFilePath = '';

try {
  logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const todayStr = new Date().toISOString().slice(0, 10);
  logFilePath = path.join(logDir, `shareclip_${todayStr}.log`);
} catch (e) {
  // Fallback to current working dir if userData is inaccessible
  logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  logFilePath = path.join(logDir, 'shareclip.log');
}

function writeLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.map(arg => {
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch (_) { return String(arg); }
    }
    return String(arg);
  }).join(' ');
  
  const logLine = `[${timestamp}] [${level}] ${formattedArgs}\n`;
  
  try {
    fs.appendFileSync(logFilePath, logLine, 'utf8');
  } catch (_) {}
}

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = function (...args) {
  originalConsoleLog.apply(console, args);
  writeLog('INFO', ...args);
};

console.warn = function (...args) {
  originalConsoleWarn.apply(console, args);
  writeLog('WARN', ...args);
};

console.error = function (...args) {
  originalConsoleError.apply(console, args);
  writeLog('ERROR', ...args);
};

// Intercept uncaught exceptions & rejections to record full stack trace before app exit ("秒退")
process.on('uncaughtException', (err, origin) => {
  writeLog('FATAL_UNCAUGHT_EXCEPTION', `Origin: ${origin}, Error:`, err);
  if (err && err.stack) writeLog('FATAL_STACK', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  writeLog('FATAL_UNHANDLED_REJECTION', `Reason:`, reason);
});

app.on('render-process-gone', (event, webContents, details) => {
  writeLog('FATAL_RENDERER_CRASH', `Renderer process gone, details:`, details);
});

app.on('child-process-gone', (event, details) => {
  writeLog('FATAL_CHILD_PROCESS_CRASH', `Child process gone, details:`, details);
});

writeLog('SYSTEM_START', `=== ShareCLIP PC Starting (v${app.getVersion()}) === Log File: ${logFilePath}`);

function getPhysicalPath(filePath) {
  return filePath.replace(/\bapp\.asar\b/, 'app.asar.unpacked');
}

let activeDeviceUuid = null;
let activeDeviceDb = null;
const { pathToFileURL } = require('url');
let ort = null;
let sharp = null;
let exifReader = null;
let SimpleTokenizer = null;
const taskManager = require('./src/workers/task-manager.cjs');

function getOrt() {
  if (!ort) {
    try { ort = require('onnxruntime-node'); } catch (err) { console.error("Critical: Failed to load onnxruntime-node.", err); }
  }
  return ort;
}

function getSharp() {
  if (!sharp) {
    try { sharp = require('sharp'); } catch (err) { console.error("Critical: Failed to load sharp.", err); }
  }
  return sharp;
}

function getExifReader() {
  if (!exifReader) {
    try { exifReader = require('exif-reader'); } catch (err) { console.error("Critical: Failed to load exif-reader.", err); }
  }
  return exifReader;
}

function getSimpleTokenizer() {
  if (!SimpleTokenizer) {
    try {
      const tokenizerModule = require('./tokenizer.cjs');
      SimpleTokenizer = tokenizerModule.SimpleTokenizer;
    } catch (err) {
      console.error("Critical: Failed to load tokenizer.cjs", err);
    }
  }
  return SimpleTokenizer;
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

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
let mainWindow = null;

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    try {
      mainWindow.webContents.send(channel, payload);
    } catch (e) {
      // Suppress destroyed webContents errors during app shutdown
    }
  }
}
let textEncoderSession = null;
let tokenizer = null;
let textEmbeddings = {};
const imageEmbeddingsCache = {}; // imagePath -> Float32Array (512-dim)

// Download path configuration (persisted in a JSON settings file)
const settingsFilePath = path.join(app.getPath('userData'), 'app_settings.json');
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
  return path.join(app.getPath('downloads'), 'ShareCLIP_Data', 'sync_storage', deviceUuid || 'default', type);
}

// BLE Signaling and chunk transfer state
let bleProcess = null;
let hotspotProcess = null;
let pcSessionId = (1000 + Math.floor(Math.random() * 9000)).toString();
const pendingTransfers = {}; // fileId -> { chunks: [], received: 0, total: 0 }

// ─────────────────────────────────────────────────────────────────
// 💓 MAIN PROCESS HEARTBEAT KEEPALIVE TIMER
// Drives heartbeat pings from the main process to guarantee they fire
// even when the renderer's JS event loop is saturated by IPC messages
// during heavy AI computation (CLIP, face recognition, clustering).
// ─────────────────────────────────────────────────────────────────
let pcHeartbeatInterval = null;

function startPcHeartbeat() {
  stopPcHeartbeat();
  pcHeartbeatInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('send-heartbeat-ping');
    }
  }, 2000); // Every 2 seconds, instruct renderer to send a Ping to keep connection alive
  console.log('[Heartbeat] Main-process heartbeat keepalive timer started (2s interval).');
}

function stopPcHeartbeat() {
  if (pcHeartbeatInterval) {
    clearInterval(pcHeartbeatInterval);
    pcHeartbeatInterval = null;
    console.log('[Heartbeat] Main-process heartbeat keepalive timer stopped.');
  }
}


// Load ONNX model and embeddings
async function initializeAI() {
  const modelPath = path.join(__dirname, 'mobileclip2_s0_image_encoder.onnx');
  const textModelPath = path.join(__dirname, 'mobileclip2_s0_text_encoder_quant.onnx');
  const mergesPath = path.join(__dirname, 'merges.txt');
  const embeddingsPath = path.join(__dirname, 'text_embeddings.json');

  const ST = getSimpleTokenizer();
  const onnxRuntime = getOrt();

  // 1. Load Tokenizer BPE Merges
  if (fs.existsSync(mergesPath) && ST) {
    try {
      console.log("[AI Init] Loading BPE merges and initializing tokenizer...");
      const mergesText = fs.readFileSync(mergesPath, 'utf-8');
      tokenizer = new ST(mergesText);
      console.log("[AI Init] Tokenizer initialized successfully.");
    } catch (err) {
      console.error("[AI Init] Failed to initialize tokenizer:", err);
    }
  } else {
    console.warn("[AI Init] merges.txt not found or tokenizer unavailable. Dynamic search will run in mock mode.");
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

  // 3. Initialize Task Manager & Worker Threads
  const physicalModelPath = getPhysicalPath(modelPath);
  const scrfdModelPath = path.join(__dirname, 'det_500m.onnx');
  const mobilefacenetModelPath = path.join(__dirname, 'w600k_mbf.onnx');
  const physicalScrfdModelPath = getPhysicalPath(scrfdModelPath);
  const physicalMobilefacenetModelPath = getPhysicalPath(mobilefacenetModelPath);
  try {
    taskManager.init(physicalModelPath, physicalScrfdModelPath, physicalMobilefacenetModelPath);
  } catch (err) {
    console.error("[AI Init] TaskManager failed to initialize models:", err);
  }

  // 4. Load Text Encoder ONNX Model
  const physicalTextModelPath = getPhysicalPath(textModelPath);
  if (onnxRuntime && fs.existsSync(physicalTextModelPath)) {
    try {
      console.log("[AI Init] Loading MobileCLIP Text Encoder ONNX model from:", physicalTextModelPath);
      textEncoderSession = await onnxRuntime.InferenceSession.create(physicalTextModelPath, {
        executionProviders: ['cpu']
      });
      console.log("[AI Init] MobileCLIP Text Encoder ONNX model loaded successfully (CPU execution provider).");
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
    const s = getSharp();
    const er = getExifReader();
    if (!s || !er) return null;
    const metadata = await s(imagePath).metadata();
    if (metadata && metadata.exif) {
      const exifData = er(metadata.exif);
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
    width: 1080,
    height: 700,
    minWidth: 900,
    minHeight: 580,
    center: true,
    title: "ShareCLIP",
    icon: path.join(__dirname, fs.existsSync(path.join(__dirname, 'icon.ico')) ? 'icon.ico' : 'icon.png'),
    backgroundColor: '#0b0f19', // Dark theme background matching CSS --bg-primary
    show: false, // Don't show immediately to prevent white/blank flicker
    frame: false, // Make window frameless
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      backgroundThrottling: false // Disable timer throttling when window is minimized or behind other apps
    }
  });

  mainWindow.setMenu(null);

  // Smoothly display window when first paint is ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  // Safety fallback: ensure window shows within 1.5s even if ready-to-show event is delayed
  const fallbackShowTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1500);

  mainWindow.on('show', () => {
    clearTimeout(fallbackShowTimer);
  });

  if (isDev) {
    const devUrl = 'http://127.0.0.1:5173';
    mainWindow.loadURL(devUrl).catch(err => {
      console.warn(`[Window] Failed to load ${devUrl}, falling back to built dist/index.html:`, err.message);
      if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
      }
    });
    // Open DevTools in detached mode only after initial paint has settled
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
      }, 800);
    });
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.warn(`[Window] did-fail-load: ${errorCode} - ${errorDescription} (${validatedURL})`);
      if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    clearTimeout(fallbackShowTimer);
    mainWindow = null;
  });
}

// App Lifecycles
app.whenReady().then(async () => {
  // Load persisted settings (download path etc.) from disk
  loadSettings();

  // Protocol handler for loading local files
  protocol.handle('local', async (request) => {
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

      // Check for dynamic crop query parameter, e.g. ?crop=100,200,80,80 for face avatar close-ups
      const cropParam = url.searchParams.get('crop');
      if (cropParam) {
        const s = getSharp();
        if (s) {
          const parts = cropParam.split(',').map(Number);
          if (parts.length === 4 && parts.every(n => !isNaN(n) && n >= 0)) {
            try {
              const [cropLeft, cropTop, cropWidth, cropHeight] = parts;
              if (cropWidth > 0 && cropHeight > 0) {
                const croppedBuffer = await s(filePath)
                  .extract({ left: Math.round(cropLeft), top: Math.round(cropTop), width: Math.round(cropWidth), height: Math.round(cropHeight) })
                  .resize(160, 160, { fit: 'cover' })
                  .jpeg({ quality: 88 })
                  .toBuffer();
                return new Response(croppedBuffer, {
                  headers: {
                    'content-type': 'image/jpeg',
                    'access-control-allow-origin': '*'
                  }
                });
              }
            } catch (cropErr) {
              console.warn(`[Local Protocol] Failed to crop ${filePath}:`, cropErr.message);
              // Fallback to normal full image load
            }
          }
        }
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
  // Create window immediately so user doesn't wait
  createWindow();

  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        // Initialize AI models in the background after UI renders to avoid blocking the main thread
        initializeAI().then(() => {
          console.log("[App] AI fully initialized in background.");
        }).catch(e => {
          console.error("[App] AI initialization error:", e);
        });
      }, 1000); // Give Vue 1 second to fully mount and paint before blocking with C++ modules
    });
  }
  // Start the async face recognition background daemon
  startBackgroundFaceScanner();
  
  // Start local network UDP discovery
  startUdpDiscoveryService();

  // Start high-speed HTTP TCP signaling service
  startHttpSignalingServer();

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

// --- Background Asynchronous Face Scanner ---
let backgroundScannerInterval = null;
let isFaceScannerRunning = false;

function startBackgroundFaceScanner() {
  // Disabled: Face scanning is now triggered manually via "刷新聚类" button.
  console.log("[Background Scanner] Automatic background face recognition is disabled by user configuration.");
}

async function scanFacesOnDemand(event) {
  if (!activeDeviceDb) return;
  console.log("[Manual Scanner] Starting manual on-demand face scanning...");

  const rows = await new Promise((resolve, reject) => {
    activeDeviceDb.all(`SELECT id, path FROM resources WHERE (type IN ('image', 'images', 'thumbnail', 'album_photo', 'photo')) AND (face_scanned = 0 OR face_scanned IS NULL)`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  const total = rows.length;
  if (total === 0) {
    console.log("[Manual Scanner] No unscanned faces found.");
    return;
  }
  console.log(`[Manual Scanner] Found ${total} images to scan for faces.`);

  const CONCURRENCY = taskManager.maxInferenceWorkers || 4;
  let done = 0;
  let totalDurationMs = 0;

  for (let batchStart = 0; batchStart < total; batchStart += CONCURRENCY) {
    const batch = rows.slice(batchStart, batchStart + CONCURRENCY);

    await Promise.all(batch.map(async (row) => {
      let durationMs = 0;
      let facesFound = 0;
      try {
        if (!fs.existsSync(row.path)) {
          await new Promise((resolve) => activeDeviceDb.run(`UPDATE resources SET face_scanned = 1 WHERE id = ?`, [row.id], resolve));
          return;
        }

        const tStart = performance.now();
        const result = await taskManager.computeFace(row.path);
        durationMs = Math.round(performance.now() - tStart);
        totalDurationMs += durationMs;

        if (result && result.faces && Array.isArray(result.faces)) {
          facesFound = result.faces.length;
          for (const face of result.faces) {
            const faceBuffer = face.embedding ? Buffer.from(face.embedding.buffer, face.embedding.byteOffset, face.embedding.byteLength) : null;
            await new Promise((resolve) => {
              activeDeviceDb.run(
                `INSERT OR REPLACE INTO faces (id, photo_id, path, bbox, landmarks, embedding) VALUES (?, ?, ?, ?, ?, ?)`,
                [face.id, row.id, row.path, face.bbox, face.landmarks, faceBuffer],
                resolve
              );
            });
          }
        }

        await new Promise((resolve) => {
          activeDeviceDb.run(`UPDATE resources SET face_scanned = 1 WHERE id = ?`, [row.id], resolve);
        });

      } catch (scanErr) {
        console.error(`[Manual Scanner] Error processing ${row.path}:`, scanErr.message);
        await new Promise((resolve) => activeDeviceDb.run(`UPDATE resources SET face_scanned = 1 WHERE id = ?`, [row.id], resolve));
      } finally {
        done++;
      }
    }));

    if (event) {
      const avgDurationMs = done > 0 ? Math.round(totalDurationMs / done) : 0;
      event.sender.send('face-scan-progress', { 
        done, 
        total, 
        currentName: path.basename(batch[batch.length - 1].path),
        avgDurationMs
      });
    }

    // Yield 100ms to Node event loop so WebRTC DataChannel heartbeats and IPC messages process smoothly
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (event) {
    event.sender.send('face-scan-progress', { done: total, total });
  }
  console.log("[Manual Scanner] Completed face scanning.");
}

// IPC Communication

// --- Local Folder Import ---
const crypto = require('crypto');

function scanImagesRecursive(dir, results = []) {
  const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.heic', '.tiff']);
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return results; }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanImagesRecursive(fullPath, results);
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('import-local-folder', async (event, { folderPath }) => {
  if (!folderPath || !fs.existsSync(folderPath)) {
    throw new Error('Invalid folder path');
  }

  // Build a deterministic UUID from the folder path
  const folderHash = crypto.createHash('md5').update(folderPath).digest('hex').slice(0, 16);
  const virtualUuid = `local_${folderHash}`;
  const folderName = path.basename(folderPath);

  // Reuse the existing init-device-sync logic to create db + directories
  activeDeviceUuid = virtualUuid;
  const baseDir = path.join(app.getPath('userData'), 'sync_storage', virtualUuid);
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  if (activeDeviceDb) { try { activeDeviceDb.close(); } catch (_) {} }

  const dbPath = path.join(baseDir, 'database.sqlite');
  activeDeviceDb = new sqlite3.Database(dbPath);

  // Create tables (mirrors init-device-sync schema)
  const run = (sql) => new Promise((res, rej) => activeDeviceDb.run(sql, (e) => e ? rej(e) : res()));
  await run(`CREATE TABLE IF NOT EXISTS resources (id TEXT PRIMARY KEY, name TEXT, path TEXT, type TEXT, size INTEGER, predictions TEXT, sync_time INTEGER, embedding BLOB, cluster_id TEXT, face_scanned INTEGER DEFAULT 0, latitude REAL, longitude REAL, create_date TEXT)`);
  await run(`CREATE TABLE IF NOT EXISTS faces (id TEXT PRIMARY KEY, photo_id TEXT, path TEXT, bbox TEXT, landmarks TEXT, embedding BLOB, person_id TEXT)`);
  await run(`CREATE TABLE IF NOT EXISTS person_clusters (id TEXT PRIMARY KEY, name TEXT, cover_face_id TEXT, face_count INTEGER)`);

  // Scan images
  const imagePaths = scanImagesRecursive(folderPath);
  console.log(`[Local Import] Found ${imagePaths.length} images in: ${folderPath}`);

  // Insert new images (skip already-existing ones by path)
  const insertStmt = activeDeviceDb.prepare(
    `INSERT OR IGNORE INTO resources (id, name, path, type, size, sync_time, face_scanned) VALUES (?, ?, ?, 'image', ?, ?, 0)`
  );
  const now = Date.now();
  for (const imgPath of imagePaths) {
    let size = 0;
    try { size = fs.statSync(imgPath).size; } catch (_) {}
    const id = crypto.createHash('md5').update(imgPath).digest('hex');
    insertStmt.run(id, path.basename(imgPath), imgPath, size, now);
  }
  insertStmt.finalize();

  // Load existing embeddings from DB into memory cache
  const rows = await new Promise((res) => activeDeviceDb.all(
    `SELECT id, name, path, type, size, predictions, embedding, latitude, longitude, create_date FROM resources`, (_, r) => res(r || [])
  ));
  for (const row of rows) {
    if (row.embedding && row.path) {
      try {
        const buf = row.embedding;
        const fa = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
        imageEmbeddingsCache[row.path] = fa;
        taskManager.addEmbeddingToSAB(row.path, fa);
      } catch (_) {}
    } else if (!row.predictions) {
      // Automatically enqueue unclassified local images to the background AI queue
      enqueueAiClassification({
        targetPath: row.path,
        filename: row.name,
        isThumbnail: false
      });
    }
  }

  return {
    uuid: virtualUuid,
    name: folderName,
    folderPath,
    totalImages: imagePaths.length,
    resources: rows.map(r => ({
      id: r.id, name: r.name, path: r.path, type: r.type, size: r.size,
      predictions: r.predictions ? JSON.parse(r.predictions) : null,
      hasEmbedding: !!r.embedding, latitude: r.latitude, longitude: r.longitude, create_date: r.create_date
    }))
  };
});

ipcMain.handle('open-thumbnail-folder', async () => {
  const rootThumbDir = path.join(app.getPath('userData'), 'thumbnail_sync');
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
    albumDir = path.join(app.getPath('downloads'), 'ShareCLIP_Data', 'album_sync', uuid);
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

async function reclusterFacesInternal() {
  if (!activeDeviceDb) return [];

  console.log("[Face Cluster] Starting high-precision face clustering process...");

  // 1. Check if there are unscanned image resources, and scan them if needed
  const unscannedCount = await new Promise((resolve) => {
    activeDeviceDb.get(`SELECT COUNT(*) as count FROM resources WHERE (type IN ('image', 'images', 'thumbnail', 'album_photo', 'photo')) AND (face_scanned = 0 OR face_scanned IS NULL)`, (err, row) => {
      resolve((row && row.count) || 0);
    });
  });

  if (unscannedCount > 0) {
    console.log(`[Face Cluster] Found ${unscannedCount} unscanned photos, running face detection first...`);
    await scanFacesOnDemand(null);
  }

  // 2. Fetch all real biometric face embeddings extracted by MobileFaceNet
  let faces = await new Promise((resolve) => {
    activeDeviceDb.all(`SELECT id, photo_id, path, bbox, landmarks, embedding FROM faces WHERE embedding IS NOT NULL`, (err, rows) => {
      resolve(rows || []);
    });
  });

  if (faces.length === 0) {
    console.log("[Face Cluster] No faces detected in photos.");
    await new Promise(r => activeDeviceDb.run(`DELETE FROM person_clusters`, () => r()));
    return [];
  }

  // 3. Populate faceSharedBuffer in TaskManager
  const validFaces = [];
  const faceSabIndices = [];

  for (const f of faces) {
    if (f.embedding) {
      const floatEmb = new Float32Array(f.embedding.buffer, f.embedding.byteOffset, f.embedding.byteLength / 4);
      if (floatEmb.length === 512) {
        const sabIdx = taskManager.addFaceEmbeddingToSAB(f.id, floatEmb);
        if (sabIdx !== -1) {
          validFaces.push(f);
          faceSabIndices.push(sabIdx);
        }
      }
    }
  }

  if (validFaces.length === 0) {
    console.log("[Face Cluster] No valid 512-dim face embeddings in SAB.");
    return [];
  }

  // 4. Run face clustering via TaskManager Search Worker with 0.50 threshold (MobileFaceNet ArcFace verified threshold)
  console.log(`[Face Cluster] Clustering ${validFaces.length} face crops (threshold: 0.50)...`);
  const rawPersonClusters = await taskManager.clusterFaces(faceSabIndices, validFaces, 0.50);

  // Keep valid person clusters
  const personClusters = rawPersonClusters.filter(c => c.face_count >= 1);

  // 5. Persist person_clusters into SQLite synchronously
  await new Promise(r => activeDeviceDb.run(`DELETE FROM person_clusters`, () => r()));
  await new Promise(r => activeDeviceDb.run(`UPDATE faces SET person_id = NULL`, () => r()));

  await new Promise((resolve) => {
    activeDeviceDb.serialize(() => {
      activeDeviceDb.run("BEGIN TRANSACTION");
      const insertClusterStmt = activeDeviceDb.prepare(
        `INSERT INTO person_clusters (id, name, cover_face_id, face_count) VALUES (?, ?, ?, ?)`
      );
      const updateFaceStmt = activeDeviceDb.prepare(
        `UPDATE faces SET person_id = ? WHERE id = ?`
      );

      for (const cluster of personClusters) {
        insertClusterStmt.run(cluster.id, cluster.name, cluster.cover_face_id, cluster.face_count);
        for (const f of cluster.faces) {
          updateFaceStmt.run(cluster.id, f.id);
        }
      }

      insertClusterStmt.finalize();
      updateFaceStmt.finalize();
      activeDeviceDb.run("COMMIT", () => resolve());
    });
  });

  console.log(`[Face Cluster] Created ${personClusters.length} person clusters successfully.`);

  // 6. Return populated clusters with cover_path and cover_bbox
  return new Promise((resolve) => {
    activeDeviceDb.all(`
      SELECT p.id, p.name, p.cover_face_id, p.face_count, f.path as cover_path, f.bbox as cover_bbox
      FROM person_clusters p
      LEFT JOIN faces f ON p.cover_face_id = f.id
      ORDER BY p.face_count DESC
    `, (err, rows) => {
      if (err || !rows) resolve([]);
      else resolve(rows);
    });
  });
}

ipcMain.handle('get-person-clusters', async () => {
  if (!activeDeviceDb) return [];
  const rows = await new Promise((resolve) => {
    activeDeviceDb.all(`
      SELECT p.id, p.name, p.cover_face_id, p.face_count, f.path as cover_path, f.bbox as cover_bbox
      FROM person_clusters p
      LEFT JOIN faces f ON p.cover_face_id = f.id
      ORDER BY p.face_count DESC
    `, (err, rows) => {
      if (err || !rows) resolve([]);
      else resolve(rows);
    });
  });

  if (rows.length > 0) {
    return rows;
  }

  // Auto-trigger clustering if person_clusters is empty!
  return await reclusterFacesInternal();
});

ipcMain.handle('recluster-faces', async (event) => {
  await scanFacesOnDemand(event);
  return await reclusterFacesInternal();
});

ipcMain.handle('recalculate-all-faces', async (event) => {
  if (!activeDeviceDb) return [];
  console.log("[Face Scanner] Forcing full recalculation of all faces...");
  
  // 1. Delete all existing face data
  await new Promise((resolve) => {
    activeDeviceDb.run(`DELETE FROM faces`, resolve);
  });
  
  await new Promise((resolve) => {
    activeDeviceDb.run(`DELETE FROM person_clusters`, resolve);
  });

  // 2. Reset face_scanned flag on all image resources so they get processed again
  await new Promise((resolve) => {
    activeDeviceDb.run(`UPDATE resources SET face_scanned = 0 WHERE type IN ('image', 'images', 'thumbnail', 'album_photo', 'photo')`, resolve);
  });

  // 3. Re-run scan and clustering
  await scanFacesOnDemand(event);
  return await reclusterFacesInternal();
});

ipcMain.handle('update-person-name', async (event, { personId, name }) => {
  if (!activeDeviceDb) return false;
  return new Promise((resolve) => {
    activeDeviceDb.run(`UPDATE person_clusters SET name = ? WHERE id = ?`, [name, personId], (err) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
});

ipcMain.handle('get-person-photos', async (event, personId) => {
  if (!activeDeviceDb) return [];
  return new Promise((resolve) => {
    activeDeviceDb.all(`
      SELECT DISTINCT r.id, r.name, r.path, r.type, r.size, r.predictions, r.latitude, r.longitude
      FROM resources r
      INNER JOIN faces f ON r.path = f.path
      WHERE f.person_id = ?
    `, [personId], (err, rows) => {
      if (err || !rows) resolve([]);
      else resolve(rows);
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
  if (imageEmbeddingsCache[imagePath]) {
    return imageEmbeddingsCache[imagePath];
  }

  // Offload computation to TaskManager pool
  try {
    const result = await taskManager.computeClip(imagePath);
    const embedding = (result && result.embedding) ? result.embedding : result;
    imageEmbeddingsCache[imagePath] = embedding;

    return embedding;
  } catch (error) {
    throw new Error(`Embedding compute failed: ${error.message}`);
  }
}

async function classifyPhotoInternal(imagePath) {
  try {
    const imageEmbedding = await computeEmbeddingInternal(imagePath);

    if (!textEmbeddings || Object.keys(textEmbeddings).length === 0) {
      throw new Error("Text embeddings not loaded. Cannot perform classification.");
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
    console.error("Error classifying photo:", error);
    const isHardware = error.message && error.message.includes("Text embeddings not loaded");
    const title = isHardware ? "💻 电脑配置过低 (不支持AI加速或内存不足)" : "❌ 分类出错";
    return [
      { category: title, score: 1.0 },
      { category: error.message || "Unknown error", score: 0.0 }
    ];
  }
}

// ─────────────────────────────────────────────────────────────────
// 🧠 BACKGROUND AI CLASSIFICATION QUEUE
// Decouples ONNX inference from WebRTC file reception to prevent event loop lag & heartbeat drops
// ─────────────────────────────────────────────────────────────────
const aiClassificationQueue = [];
let isProcessingAiQueue = false;
let lastNetworkTransferTime = 0;
let aiTotalBatchTasks = 0;
let aiCompletedBatchTasks = 0;

let aiQueueProgressThrottleTimer = null;
function sendAiQueueProgress(immediate = false) {
  if (immediate) {
    if (aiQueueProgressThrottleTimer) {
      clearTimeout(aiQueueProgressThrottleTimer);
      aiQueueProgressThrottleTimer = null;
    }
    _doSendAiQueueProgress();
    return;
  }

  if (aiQueueProgressThrottleTimer) return;
  aiQueueProgressThrottleTimer = setTimeout(() => {
    aiQueueProgressThrottleTimer = null;
    _doSendAiQueueProgress();
  }, 150);
}

function _doSendAiQueueProgress() {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('ai-queue-progress', {
      isProcessing: isProcessingAiQueue || aiClassificationQueue.length > 0,
      total: aiTotalBatchTasks,
      completed: aiCompletedBatchTasks,
      remaining: aiClassificationQueue.length
    });
  }
}

function enqueueAiClassification(item) {
  if (aiClassificationQueue.length === 0 && !isProcessingAiQueue) {
    aiTotalBatchTasks = 0;
    aiCompletedBatchTasks = 0;
  }
  aiTotalBatchTasks++;
  aiClassificationQueue.push(item);
  sendAiQueueProgress();
  processAiQueue();
}

async function processAiQueue() {
  if (isProcessingAiQueue) return;
  isProcessingAiQueue = true;

  while (aiClassificationQueue.length > 0) {
    // If WebRTC file/thumbnail transfers are actively occurring right now (< 2s ago),
    // throttle AI queue execution to yield 100% CPU/bandwidth to network transfer and heartbeats!
    const timeSinceLastTransfer = Date.now() - lastNetworkTransferTime;
    if (timeSinceLastTransfer < 2000) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const task = aiClassificationQueue.shift();
    try {
      if (fs.existsSync(task.targetPath)) {
        const predictions = await classifyPhotoInternal(task.targetPath);
        const predictionsStr = JSON.stringify(predictions);

        let embeddingBuffer = null;
        const emb = imageEmbeddingsCache[task.targetPath];
        if (emb && emb.buffer) {
          embeddingBuffer = Buffer.from(emb.buffer, emb.byteOffset, emb.byteLength);
        }

        if (activeDeviceUuid && activeDeviceDb) {
          activeDeviceDb.run(
            `UPDATE resources SET predictions = ?, embedding = ? WHERE path = ?`,
            [predictionsStr, embeddingBuffer, task.targetPath],
            (err) => {
              if (err) console.error(`[AI Queue DB] Error updating ${task.filename}:`, err);
            }
          );
        }

        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('single-photo-predictions-updated', {
            id: task.filename,
            path: task.targetPath,
            name: task.filename,
            predictions
          });
          mainWindow.webContents.send('photo-synced', {
            isThumbnail: task.isThumbnail,
            path: task.targetPath,
            name: task.filename,
            src: `local:///${task.targetPath.replace(/\\/g, '/')}`,
            predictions,
            latitude: task.latitude,
            longitude: task.longitude
          });
        }
      }
    } catch (err) {
      console.error(`[AI Queue] Error processing ${task.targetPath}:`, err.message);
    }

    aiCompletedBatchTasks++;
    sendAiQueueProgress();

    // Yield 50ms to Node event loop so WebRTC data channel packets & heartbeats process smoothly
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  isProcessingAiQueue = false;
  sendAiQueueProgress();
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

  // 0. MUST clear RAM cache to force new model to extract features!
  Object.keys(imageEmbeddingsCache).forEach(key => delete imageEmbeddingsCache[key]);

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

  // 2. Concurrent batch processing — send CONCURRENCY images in parallel
  const CONCURRENCY = taskManager.maxInferenceWorkers || 4;
  console.log(`[AI Reclassify] Processing ${total} photos with concurrency: ${CONCURRENCY}`);

  let done = 0;
  for (let batchStart = 0; batchStart < total; batchStart += CONCURRENCY) {
    const batch = rows.slice(batchStart, batchStart + CONCURRENCY);

    await Promise.all(batch.map(async (row) => {
      try {
        if (!fs.existsSync(row.path)) return;

        const predictions = await classifyPhotoInternal(row.path);
        const predictionsStr = JSON.stringify(predictions);

        let embeddingBuffer = null;
        const emb = imageEmbeddingsCache[row.path];
        if (emb && emb.buffer) {
          embeddingBuffer = Buffer.from(emb.buffer, emb.byteOffset, emb.byteLength);
        }

        await new Promise((resolve, reject) => {
          activeDeviceDb.run(
            `UPDATE resources SET predictions = ?, embedding = ?, face_scanned = 0 WHERE id = ?`,
            [predictionsStr, embeddingBuffer, row.id],
            (err) => { if (err) reject(err); else resolve(); }
          );
        });

        event.sender.send('single-photo-predictions-updated', { id: row.id, predictions });

      } catch (err) {
        console.error(`[AI Reclassify] Failed for ${row.name}:`, err);
      } finally {
        done++;
      }
    }));

    // Report progress after each batch completes
    event.sender.send('reclassify-progress', {
      done,
      total,
      currentName: batch[batch.length - 1].name
    });

    // Yield 100ms to Node event loop so WebRTC DataChannel heartbeats and IPC messages process smoothly
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Final progress notification
  event.sender.send('reclassify-progress', {
    done: total,
    total,
    currentName: 'Completed'
  });

  // Automatically trigger face clustering at the end of AI re-classification!
  try {
    console.log("[AI Reclassify] Automatically triggering face clustering...");
    await reclusterFacesInternal();
  } catch (err) {
    console.error("[AI Reclassify] Auto face clustering failed:", err);
  }

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

ipcMain.handle('get-similar-images-groups', async (event, { imageList, threshold }) => {
  if (!activeDeviceDb) return [];
  
  console.log(`[AI Similar] Fetching pre-clustered similarity groups from database...`);

  // 1. Fetch pre-clustered rows (O(1) retrieval)
  const dbRows = await new Promise((resolve, reject) => {
    activeDeviceDb.all(
      `SELECT cluster_id, id, name, path, type, size FROM resources WHERE cluster_id IS NOT NULL`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  // 2. Filter by the imageList currently visible in the UI
  const validIds = new Set(imageList.map(img => img.id));
  const validRows = dbRows.filter(r => validIds.has(r.id));
  
  // 3. Find unclustered images in imageList
  const clusteredIds = new Set(validRows.map(r => r.id));
  const unclusteredImages = imageList.filter(img => !clusteredIds.has(img.id));
  
  // 4. Group validRows by cluster_id
  const clusterMap = new Map();
  for (const row of validRows) {
    if (!clusterMap.has(row.cluster_id)) {
      clusterMap.set(row.cluster_id, []);
    }
    clusterMap.get(row.cluster_id).push(row);
  }

  const finalGroups = [];

  // 5. Refine DB clusters based on user's dynamic threshold in memory
  for (const [clusterId, groupMembers] of clusterMap.entries()) {
    if (groupMembers.length < 2) continue;
    
    // Sub-cluster them in memory to honor the UI's dynamic threshold
    const subClusters = []; // [ [img1, img2], [img3] ]
    for (let i = 0; i < groupMembers.length; i++) {
      const imgI = groupMembers[i];
      const embI = imageEmbeddingsCache[imgI.path];
      if (!embI) continue;
      
      let bestGroupIdx = -1;
      let bestSim = -1;
      
      for (let g = 0; g < subClusters.length; g++) {
        const leader = subClusters[g][0];
        const embLeader = imageEmbeddingsCache[leader.path];
        if (!embLeader) continue;
        
        const sim = cosineSimilarity(embI, embLeader);
        if (sim > bestSim) {
          bestSim = sim;
          bestGroupIdx = g;
        }
      }
      
      if (bestSim >= threshold) {
        subClusters[bestGroupIdx].push(imgI);
      } else {
        subClusters.push([imgI]);
      }
    }
    
    // Calculate maxSimWithGroup for UI and push sub-clusters >= 2
    for (const sub of subClusters) {
      if (sub.length >= 2) {
        const processedGroup = sub.map(img => {
           let maxSim = 0;
           const embI = imageEmbeddingsCache[img.path];
           if (embI) {
             for (const other of sub) {
               if (other.id !== img.id) {
                 const embOther = imageEmbeddingsCache[other.path];
                 if (embOther) {
                   const sim = cosineSimilarity(embI, embOther);
                   if (sim > maxSim) maxSim = sim;
                 }
               }
             }
           }
           return { ...img, maxSimWithGroup: maxSim };
        });
        processedGroup.sort((a, b) => (b.size || 0) - (a.size || 0));
        finalGroups.push({ images: processedGroup });
      }
    }
  }

  // 6. Handle Unclustered Images dynamically via Worker Pool (Fallback)
  if (unclusteredImages.length > 0) {
    console.log(`[AI Similar] Dynamically clustering ${unclusteredImages.length} unclustered images...`);
    const sabIndices = [];
    const validUnclustered = [];
    
    for (const img of unclusteredImages) {
      if (!imageEmbeddingsCache[img.path]) continue; // Skip images that haven't been computed yet
      const idx = taskManager.getExistingSabIndex(img.path);
      if (idx !== -1) {
        sabIndices.push(idx);
        validUnclustered.push(img);
      }
    }
    
    if (sabIndices.length > 0) {
      try {
        const dynamicGroups = await taskManager.clusterImages(sabIndices, validUnclustered, threshold);
        for (const dg of dynamicGroups) {
          finalGroups.push(dg);
        }
      } catch (err) {
        console.error("[AI Similar] Dynamic fallback clustering failed:", err);
      }
    }
  }

  // Notify UI
  event.sender.send('similar-progress', {
    done: 100,
    total: 100,
    currentName: 'Completed'
  });

  console.log(`[AI Similar] Retrieved ${finalGroups.length} groups of similar images.`);
  return finalGroups;
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
    try { bleProcess.kill(); } catch (_) {}
    bleProcess = null;
  }

  // Forcefully cleanup any orphan ble_signaling_server.exe processes from previous crashes
  try {
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      execSync('taskkill /f /im ble_signaling_server.exe 2>nul || exit 0', { stdio: 'ignore' });
    }
  } catch (_) {}
  
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
    let lastBleError = null;

    bleProcess.on('error', (err) => {
      console.error("[BLE Helper Spawn Error]:", err);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    bleProcess.on('exit', (code, signal) => {
      console.log(`[BLE Helper Exited]: code=${code}, signal=${signal}`);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(lastBleError || `BLE GATT Server exited with code ${code}`));
      }
    });
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(lastBleError || "BLE GATT Server startup timeout (5s)"));
      }
    }, 5000);
    
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

      if (line.startsWith("ERROR:")) {
        lastBleError = line.substring(6).trim();
        if (!resolved && (lastBleError.toLowerCase().includes("radio") || lastBleError.toLowerCase().includes("adapter") || lastBleError.toLowerCase().includes("not available") || lastBleError.toLowerCase().includes("failed"))) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error(lastBleError));
        }
      } else if (line.startsWith("MAC:")) {
        macAddress = line.substring(4).trim();
      } else if (line.startsWith("STATUS:ADVERTISING")) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          
          const localIps = getValidPhysicalIps();

          resolve({
            ble_mac: macAddress,
            service_uuid,
            char_uuid,
            session_id: pcSessionId,
            pc_ips: localIps,
            http_port: httpSignalingPort,
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
      if (msg) lastBleError = msg;
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
        const errDetail = lastBleError ? `${lastBleError} (exit code ${code})` : `BLE Helper process exited with code ${code}`;
        reject(new Error(errDetail));
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

ipcMain.handle('get-valid-physical-ips', async () => {
  return getValidPhysicalIps();
});

ipcMain.handle('get-pc-session-id', async () => {
  return pcSessionId;
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
  
  const baseDir = path.join(app.getPath('userData'), 'sync_storage', deviceUuid);
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
        embedding BLOB,
        cluster_id TEXT,
        face_scanned INTEGER DEFAULT 0
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Safe schema upgrade: ALTER TABLE to add embedding if it's missing from previous versions
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN embedding BLOB`, () => {
      resolve(); // ignore error if already exists
    });
  });

  // Safe schema upgrade: ALTER TABLE to add cluster_id if missing
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN cluster_id TEXT`, () => {
      resolve(); // ignore error if already exists
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

  // Safe schema upgrade: add face_scanned for background asynchronous face recognition
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN face_scanned INTEGER DEFAULT 0`, () => {
      resolve(); // ignore error if already exists
    });
  });

  // Safe schema upgrade: add duration for video files
  await new Promise((resolve) => {
    activeDeviceDb.run(`ALTER TABLE resources ADD COLUMN duration REAL`, () => {
      resolve(); // ignore error if already exists
    });
  });

  // Create faces table for storing face BBoxes and face Embeddings
  await new Promise((resolve) => {
    activeDeviceDb.run(`
      CREATE TABLE IF NOT EXISTS faces (
        id TEXT PRIMARY KEY,
        photo_id TEXT,
        path TEXT,
        bbox TEXT,
        landmarks TEXT,
        embedding BLOB,
        person_id TEXT
      )
    `, () => resolve());
  });

  // Create person_clusters table for storing people/person album groups
  await new Promise((resolve) => {
    activeDeviceDb.run(`
      CREATE TABLE IF NOT EXISTS person_clusters (
        id TEXT PRIMARY KEY,
        name TEXT,
        cover_face_id TEXT,
        face_count INTEGER
      )
    `, () => resolve());
  });
  
  // Read and return already synced assets
  const syncInfo = await new Promise((resolve, reject) => {
    activeDeviceDb.all(`SELECT id, name, path, type, size, predictions, embedding, latitude, longitude, create_date, duration FROM resources`, (err, rows) => {
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
              const floatArrayClone = Float32Array.from(floatArray); // safe clone
              imageEmbeddingsCache[row.path] = floatArrayClone; 
              taskManager.addEmbeddingToSAB(row.path, floatArrayClone);
            } catch (loadErr) {
              console.error(`[Database] Failed to load embedding from DB for ${row.path}:`, loadErr);
            }
          }
          // Delete heavy 2KB BLOB buffer from object to prevent V8 Heap OOM memory crash over IPC
          delete row.embedding;
        }

        // Find the most recent create_date among album_photo records for breakpoint resume
        let lastAlbumSyncDate = '';
        const albumRows = rows.filter(r => r.type === 'album_photo' && r.create_date);
        if (albumRows.length > 0) {
          const sorted = albumRows.sort((a, b) => (a.create_date > b.create_date ? 1 : -1));
          lastAlbumSyncDate = sorted[sorted.length - 1].create_date;
        }

        // Find the most recent create_date among video records for breakpoint resume
        let lastVideoSyncDate = '';
        const videoRows = rows.filter(r => r.type === 'video' && r.create_date);
        if (videoRows.length > 0) {
          const sorted = videoRows.sort((a, b) => (a.create_date > b.create_date ? 1 : -1));
          lastVideoSyncDate = sorted[sorted.length - 1].create_date;
        }
        
        resolve({ syncedIds, resources: rows, lastAlbumSyncDate, lastVideoSyncDate });
      }
    });
  });
  
  console.log(`[Database] Initialized for device: ${deviceName} (${deviceUuid}). Loaded ${syncInfo.syncedIds.length} synced assets. Last album sync: ${syncInfo.lastAlbumSyncDate || 'none'}`);
  
  // Kick off background clustering in case there are unclustered images
  scheduleBackgroundClustering();
  
  // Start main-process driven heartbeat keepalive to prevent disconnects during AI computation
  startPcHeartbeat();
  
  return syncInfo;
});

ipcMain.handle('clear-device-database', async (event) => {
  if (!activeDeviceDb) {
    console.log('[Database] clear-device-database failed: no active device database.');
    return false;
  }
  
  try {
    // 0. Clear pending AI queue tasks
    aiClassificationQueue.length = 0;
    isProcessingAiQueue = false;
    sendAiQueueProgress();

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
      const thumbDir = path.join(app.getPath('userData'), 'thumbnail_sync', activeDeviceUuid);
      const syncDir = path.join(app.getPath('userData'), 'sync_storage', activeDeviceUuid);
      
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
  const folderToOpen = customDownloadPath || path.join(app.getPath('downloads'), 'ShareCLIP_Data', 'sync_storage');
  if (!fs.existsSync(folderToOpen)) {
    fs.mkdirSync(folderToOpen, { recursive: true });
  }
  shell.openPath(folderToOpen);
  return true;
});

ipcMain.handle('open-file-location', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
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
            progressCallback(progress, downloadedBytes, totalBytes);
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

const { autoUpdater } = require('electron-updater');

ipcMain.handle('open-log-folder', async () => {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    shell.openPath(logDir);
    return { success: true, path: logDir };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-log-path', async () => {
  return logFilePath;
});

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

let updateDownloadEventSender = null;
let lastUpdateProgressInfo = {
  percent: 0,
  transferredMB: '0.00',
  totalMB: '0.00',
  isDifferential: false,
  updateType: 'full'
};

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  const transferredMB = (progressObj.transferred / (1024 * 1024)).toFixed(2);
  const totalMB = (progressObj.total / (1024 * 1024)).toFixed(2);
  // Full installer size is ~96.5 MB. If progressObj.total < 40 MB, it's a differential patch!
  const isDifferential = progressObj.total > 0 && progressObj.total < 40 * 1024 * 1024;
  
  lastUpdateProgressInfo = {
    percent,
    transferredMB,
    totalMB,
    isDifferential,
    updateType: isDifferential ? 'differential' : 'full'
  };

  if (updateDownloadEventSender) {
    updateDownloadEventSender.send('update-download-progress', lastUpdateProgressInfo);
  }
});

function isNewVersionAvailable(current, latest) {
  if (!current || !latest) return false;
  const cParts = current.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const lParts = latest.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
    const c = cParts[i] || 0;
    const l = lParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

ipcMain.handle('check-for-updates', async () => {
  const currentVersion = app.getVersion();
  
  // Method 1: autoUpdater check
  try {
    const result = await autoUpdater.checkForUpdates();
    if (result && result.updateInfo) {
      const latestVersion = result.updateInfo.version;
      const available = isNewVersionAvailable(currentVersion, latestVersion);
      
      return {
        available,
        currentVersion,
        latestVersion,
        url: `https://github.com/NovaMindLab/AIShare-Grabber/releases/tag/v${latestVersion}`,
        downloadUrl: 'managed',
        body: typeof result.updateInfo.releaseNotes === 'string' ? result.updateInfo.releaseNotes : 'A new update is available.'
      };
    }
  } catch (err) {
    console.warn('[Update Check] autoUpdater check failed, using direct GitHub API fallback:', err.message);
  }

  // Method 2: Direct GitHub API check fallback
  try {
    const releaseInfoStr = await new Promise((resolve, reject) => {
      https.get('https://api.github.com/repos/NovaMindLab/AIShare-Grabber/releases/latest', {
        headers: { 'User-Agent': 'ShareCLIP-PC-App' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const releaseInfo = JSON.parse(releaseInfoStr);
    if (releaseInfo && releaseInfo.tag_name) {
      const latestTag = releaseInfo.tag_name;
      const latestVersion = latestTag.replace(/^v/, '');
      const available = isNewVersionAvailable(currentVersion, latestVersion);
      
      let downloadUrl = '';
      if (releaseInfo.assets && releaseInfo.assets.length > 0) {
        for (const asset of releaseInfo.assets) {
          if (asset.name.includes('Setup') && asset.name.endsWith('.exe')) {
            downloadUrl = asset.browser_download_url;
            break;
          }
        }
      }

      return {
        available,
        currentVersion,
        latestVersion,
        url: releaseInfo.html_url || `https://github.com/NovaMindLab/AIShare-Grabber/releases/tag/${latestTag}`,
        downloadUrl: downloadUrl || releaseInfo.html_url,
        body: releaseInfo.body || 'A new update is available.'
      };
    }
    return { available: false, currentVersion };
  } catch (err) {
    console.error('[Update Check] Direct GitHub API check failed:', err.message);
    return { available: false, currentVersion, error: err.message };
  }
});

ipcMain.handle('start-update-download', async (event, customUrl) => {
  try {
    console.log('[Update Download] Starting download...');
    updateDownloadEventSender = event.sender;
    
    // Attempt 1: autoUpdater
    let success = false;
    try {
      await new Promise((resolve, reject) => {
        let timeout = setTimeout(() => reject(new Error("autoUpdater download timeout (12s idle)")), 12000);
        
        const progressHandler = () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => reject(new Error("autoUpdater download timeout (12s idle)")), 12000);
        };
        autoUpdater.on('download-progress', progressHandler);
        
        autoUpdater.once('update-downloaded', () => { 
          clearTimeout(timeout); 
          autoUpdater.removeListener('download-progress', progressHandler);
          resolve(); 
        });
        autoUpdater.once('error', (err) => { 
          clearTimeout(timeout); 
          autoUpdater.removeListener('download-progress', progressHandler);
          reject(err); 
        });
        
        autoUpdater.downloadUpdate();
      });
      success = true;
    } catch (autoErr) {
      console.warn('[Update Download] autoUpdater failed, using direct GitHub fallback:', autoErr.message);
    }

    if (success) {
      return { 
        success: true, 
        filePath: 'managed',
        isDifferential: lastUpdateProgressInfo.isDifferential,
        updateType: lastUpdateProgressInfo.updateType,
        transferredMB: lastUpdateProgressInfo.transferredMB,
        totalMB: lastUpdateProgressInfo.totalMB
      };
    }

    // Attempt 2: Fallback to direct HTTPS download from latest GitHub Release
    const destDir = app.getPath('downloads');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    let targetDownloadUrl = customUrl;
    if (!targetDownloadUrl || targetDownloadUrl === 'managed') {
      const releaseInfoStr = await new Promise((resolve, reject) => {
        https.get('https://api.github.com/repos/NovaMindLab/AIShare-Grabber/releases/latest', {
          headers: { 'User-Agent': 'ShareCLIP-PC-App' }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });
      const releaseInfo = JSON.parse(releaseInfoStr);
      if (releaseInfo && releaseInfo.assets) {
        for (const asset of releaseInfo.assets) {
          if (asset.name.includes('Setup') && asset.name.endsWith('.exe')) {
            targetDownloadUrl = asset.browser_download_url;
            break;
          }
        }
      }
    }

    if (!targetDownloadUrl || targetDownloadUrl === 'managed') {
      throw new Error("Could not locate setup .exe URL in latest GitHub release.");
    }

    const exeName = path.basename(targetDownloadUrl.split('?')[0]) || 'ShareCLIP_Setup_Update.exe';
    const destPath = path.join(destDir, exeName);

    console.log(`[Update Download] Direct download fallback from ${targetDownloadUrl} to ${destPath}`);
    await downloadFile(targetDownloadUrl, destPath, (progress, transferred, total) => {
      const transferredMB = (transferred / (1024 * 1024)).toFixed(2);
      const totalMB = (total / (1024 * 1024)).toFixed(2);
      lastUpdateProgressInfo = {
        percent: progress,
        transferredMB,
        totalMB,
        isDifferential: false,
        updateType: 'full'
      };
      if (updateDownloadEventSender) {
        updateDownloadEventSender.send('update-download-progress', lastUpdateProgressInfo);
      }
    });

    console.log(`[Update Download] Direct download completed: ${destPath}`);
    return { 
      success: true, 
      filePath: destPath,
      isDifferential: false,
      updateType: 'full',
      transferredMB: lastUpdateProgressInfo.transferredMB,
      totalMB: lastUpdateProgressInfo.totalMB
    };

  } catch (err) {
    console.error('[Update Download] Error downloading update:', err.message);
    return { success: false, error: err.message };
  } finally {
    updateDownloadEventSender = null;
  }
});

ipcMain.handle('install-update', async (event, filePath) => {
  try {
    console.log('[Update Install] Installing update, target:', filePath);
    if (!filePath || filePath === 'managed') {
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true);
      });
    } else if (fs.existsSync(filePath)) {
      shell.openPath(filePath);
      setTimeout(() => {
        app.quit();
      }, 1000);
    } else {
      throw new Error(`Installer file does not exist at ${filePath}`);
    }
    return { success: true };
  } catch (err) {
    console.error('[Update Install] Error installing update:', err.message);
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------------------------
// YT-DLP Integration
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

async function ensureYtDlp(event) {
  const binDir = path.join(app.getPath('userData'), 'bin');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  const ytDlpPath = path.join(binDir, 'yt-dlp.exe');
  
  if (!fs.existsSync(ytDlpPath)) {
    console.log(`[YT-DLP] Downloading yt-dlp.exe to ${ytDlpPath}`);
    if (event) event.sender.send('yt-progress', { status: 'Downloading yt-dlp.exe core...', progress: 0 });
    await downloadFile(YTDLP_URL, ytDlpPath, (progress) => {
      if (event) event.sender.send('yt-progress', { status: `Downloading core: ${progress}%`, progress });
    });
    console.log(`[YT-DLP] Download complete.`);
  }
  return ytDlpPath;
}

ipcMain.handle('yt-get-info', async (event, url) => {
  try {
    const ytPath = await ensureYtDlp(event);
    if (event) event.sender.send('yt-progress', { status: 'Parsing video information...', progress: 0 });
    
    return new Promise((resolve, reject) => {
      const args = ['-J', '--no-playlist', url];
      const child = require('child_process').spawn(ytPath, args);
      const outputChunks = [];
      let errOutput = '';
      
      child.stdout.on('data', data => { outputChunks.push(data); });
      child.stderr.on('data', data => { errOutput += data.toString(); });
      
      child.on('close', code => {
        if (code === 0) {
          try {
            const output = Buffer.concat(outputChunks).toString('utf8');
            // Find the start of the JSON object, in case of warnings
            const jsonStart = output.indexOf('{');
            if (jsonStart === -1) throw new Error('No JSON object found in output');
            const cleanOutput = output.substring(jsonStart);
            
            const info = JSON.parse(cleanOutput);
            
            const validFormats = (info.formats || []).filter(f => {
              const hasVideo = f.vcodec && f.vcodec !== 'none';
              const hasAudio = f.acodec && f.acodec !== 'none';
              if (hasVideo && hasAudio) return true;
              if (!hasVideo && hasAudio) return true;
              return false;
            }).map(f => ({
              format_id: f.format_id,
              ext: f.ext,
              resolution: f.resolution || 'Audio',
              note: f.format_note || '',
              vcodec: f.vcodec,
              acodec: f.acodec,
              filesize: f.filesize || f.filesize_approx || 0
            })).sort((a, b) => b.filesize - a.filesize);
            
            const uniqueFormats = [];
            const seenRes = new Set();
            for (const f of validFormats) {
              const key = f.resolution === 'Audio' ? 'Audio-' + f.ext : f.resolution;
              if (!seenRes.has(key)) {
                seenRes.add(key);
                uniqueFormats.push(f);
              }
            }

            resolve({
              success: true,
              title: info.title,
              thumbnail: info.thumbnail,
              duration: info.duration,
              formats: uniqueFormats.length > 0 ? uniqueFormats : [{ format_id: 'best', resolution: 'Auto (Best)', note: 'default', ext: 'mp4' }]
            });
          } catch (e) {
            console.error('[YT-DLP PARSE ERR]', e.message);
            resolve({ success: false, error: 'Failed to parse output: ' + e.message });
          }
        } else {
          console.error('[YT-DLP ERR]', errOutput);
          resolve({ success: false, error: errOutput.trim() || `Failed with code ${code}` });
        }
      });
      child.on('error', err => resolve({ success: false, error: err.message }));
    });
  } catch(err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('yt-download', async (event, { url, outputDir, formatId }) => {
  try {
    const ytPath = await ensureYtDlp(event);
    const destDir = outputDir || path.join(app.getPath('downloads'), 'ShareCLIP_Video');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const fmt = formatId || 'best';
      const args = [
        '-f', fmt,
        '-o', path.join(destDir, '%(title)s.%(ext)s'),
        '--no-playlist',
        url
      ];
      
      console.log(`[YT-DLP] Spawning: ${ytPath} ${args.join(' ')}`);
      event.sender.send('yt-progress', { status: 'Extracting video info...', progress: 0 });

      const child = require('child_process').spawn(ytPath, args);

      child.stdout.on('data', (data) => {
        const text = data.toString();
        const match = text.match(/\[download\]\s+([\d\.]+)%\s+of\s+~?([\d\.]+[A-Za-z]+)(?:\s+at\s+([^ ]+))?(?:\s+ETA\s+([^ ]+))?/);
        if (match) {
          event.sender.send('yt-progress', {
            status: 'Downloading',
            progress: parseFloat(match[1]),
            size: match[2],
            speed: match[3] || 'N/A',
            eta: match[4] || 'N/A'
          });
        } else if (text.includes('[ExtractAudio]') || text.includes('[Merger]')) {
          event.sender.send('yt-progress', { status: 'Merging/Processing...', progress: 100 });
        } else if (text.includes('[info]') || text.includes('[youtube]')) {
          const cleanText = text.trim();
          if (cleanText.length > 5 && cleanText.length < 100) {
             event.sender.send('yt-progress', { status: cleanText, progress: 0 });
          }
        }
      });

      child.stderr.on('data', (data) => {
        console.error(`[YT-DLP ERR] ${data}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, destDir });
        } else {
          resolve({ success: false, error: `yt-dlp exited with code ${code}` });
        }
      });
      
      child.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------------------------

ipcMain.handle('save-full-photo', async (event, { fileId, payload, metadata }) => {
  const fullBuffer = Buffer.from(payload);
  
  let filename = '';
  let assetId = '';
  let ext = '';
  
  if (metadata && metadata.name) {
    // Sanitize metadata.name for safe file storage across Windows/Mac/Linux
    filename = path.basename(metadata.name).replace(/[/\\:*?"<>|]/g, '_').trim();
    assetId = metadata.assetId || metadata.asset_id || filename;
    ext = path.extname(filename).toLowerCase();
  }
  
  // Fallback to buffer analysis if no extension from filename
  if (!ext) {
    ext = getExtension(fullBuffer);
  }
  
  if (!filename) {
    filename = `synced_${Date.now()}_${fileId}${ext}`;
    assetId = filename;
  }
  
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma', '.opus'];
  const videoExtensions = ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv', '.3gp'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.heic', '.heif', '.dng', '.raw'];
  
  let type = 'files';
  if (audioExtensions.includes(ext) || filename.startsWith('audio_')) {
    type = 'audios';
  } else if (videoExtensions.includes(ext) || filename.startsWith('video_')) {
    type = 'videos';
  } else if (imageExtensions.includes(ext) || filename.startsWith('photo_') || filename.startsWith('album_')) {
    type = 'images';
  }
  
  const isThumbnail = filename.startsWith('thumb_');
  const isAlbumPhoto = filename.startsWith('album_') || (type === 'images' && !isThumbnail);
  const isVideo = type === 'videos';
  const isAudio = type === 'audios';
  
  let targetPath = '';
  if (isThumbnail) {
    // Thumbnails always stored in __dirname/thumbnail_sync/<uuid>/
    const targetDir = path.join(app.getPath('userData'), 'thumbnail_sync', activeDeviceUuid || 'default');
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
      : path.join(app.getPath('downloads'), 'ShareCLIP_Data', 'album_sync', activeDeviceUuid || 'default', dateFolderName);
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    targetPath = path.join(baseDir, filename);
  } else if (isVideo) {
    // Videos stored under videos_sync/<uuid>/<YYYY-MM-DD>/ for date-based organization
    const createDateStr = metadata && metadata.create_date ? metadata.create_date : new Date().toISOString();
    const dateFolderName = createDateStr.substring(0, 10); // 'YYYY-MM-DD'
    const baseDir = customDownloadPath
      ? path.join(customDownloadPath, 'videos_sync', activeDeviceUuid || 'default', dateFolderName)
      : path.join(app.getPath('downloads'), 'ShareCLIP_Data', 'videos_sync', activeDeviceUuid || 'default', dateFolderName);
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    targetPath = path.join(baseDir, filename);
  } else if (isAudio) {
    // Audios stored under audios_sync/<uuid>/<YYYY-MM-DD>/ for date-based organization
    const createDateStr = metadata && metadata.create_date ? metadata.create_date : new Date().toISOString();
    const dateFolderName = createDateStr.substring(0, 10); // 'YYYY-MM-DD'
    const baseDir = customDownloadPath
      ? path.join(customDownloadPath, 'audios_sync', activeDeviceUuid || 'default', dateFolderName)
      : path.join(app.getPath('downloads'), 'ShareCLIP_Data', 'audios_sync', activeDeviceUuid || 'default', dateFolderName);
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
    const aiimageDir = path.join(app.getPath('downloads'), 'ShareCLIP_Data', 'aiimage');
    if (!fs.existsSync(aiimageDir)) {
      fs.mkdirSync(aiimageDir, { recursive: true });
    }
    targetPath = path.join(aiimageDir, filename);
  }
  
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  try {
    fs.writeFileSync(targetPath, fullBuffer);
    console.log(`[Sync] Saved reassembled file to ${targetPath}`);
  } catch (writeErr) {
    console.error(`[Sync] Failed writing to ${targetPath}, attempting fallback:`, writeErr);
    const safeName = `synced_${Date.now()}_${fileId}${ext || '.jpg'}`;
    targetPath = path.join(app.getPath('userData'), 'synced_fallback', safeName);
    const fbDir = path.dirname(targetPath);
    if (!fs.existsSync(fbDir)) fs.mkdirSync(fbDir, { recursive: true });
    fs.writeFileSync(targetPath, fullBuffer);
    filename = safeName;
  }
  
  // Register record in SQLite database if device is connected
  if (activeDeviceUuid && activeDeviceDb) {
    const size = fullBuffer.length;
    const syncTime = Date.now();
    const createDate = metadata && metadata.create_date ? metadata.create_date : null;
    const duration = metadata && metadata.duration ? metadata.duration : null;
    
    // Get the cached embedding Buffer
    let embeddingBuffer = null;
    const emb = imageEmbeddingsCache[targetPath];
    if (emb && emb.buffer) {
      embeddingBuffer = Buffer.from(emb.buffer, emb.byteOffset, emb.byteLength);
    }

    const resolvedType = isAudio ? 'audio' : (isVideo ? 'video' : (isAlbumPhoto ? 'album_photo' : (isThumbnail ? 'thumbnail' : type)));

    activeDeviceDb.run(`
      INSERT OR REPLACE INTO resources (id, name, path, type, size, predictions, sync_time, embedding, latitude, longitude, create_date, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      assetId, 
      filename, 
      targetPath, 
      resolvedType, 
      size, 
      '[]', 
      syncTime, 
      embeddingBuffer,
      metadata && metadata.latitude !== undefined ? metadata.latitude : null,
      metadata && metadata.longitude !== undefined ? metadata.longitude : null,
      createDate,
      duration
    ], (err) => {
      if (err) {
        console.error(`[Database] Error registering synced asset ${assetId}:`, err);
      } else {
        console.log(`[Database] Registered synced asset: ${filename} (ID: ${assetId}, type: ${resolvedType})`);
      }
    });
  }
  
  lastNetworkTransferTime = Date.now();

  // Notify renderer immediately that file is saved on disk so UI updates instantly
  if (mainWindow) {
    const resolvedType = isAudio ? 'audio' : (isVideo ? 'video' : (isAlbumPhoto ? 'album_photo' : (isThumbnail ? 'thumbnail' : type)));
    mainWindow.webContents.send('photo-synced', {
      isThumbnail,
      assetId: metadata && (metadata.assetId || metadata.asset_id) ? (metadata.assetId || metadata.asset_id) : assetId,
      id: metadata && (metadata.assetId || metadata.asset_id) ? (metadata.assetId || metadata.asset_id) : assetId,
      type: resolvedType,
      path: targetPath,
      name: filename,
      size: fullBuffer.length,
      duration,
      create_date: createDate,
      src: `local:///${targetPath.replace(/\\/g, '/')}`,
      predictions: [],
      latitude: metadata && metadata.latitude !== undefined ? metadata.latitude : null,
      longitude: metadata && metadata.longitude !== undefined ? metadata.longitude : null
    });
  }
  
  // Enqueue image for background AI classification to keep WebRTC DataChannel latency & heartbeats smooth
  if (type === 'images' || isThumbnail) {
    enqueueAiClassification({
      targetPath,
      filename,
      isThumbnail,
      latitude: metadata && metadata.latitude !== undefined ? metadata.latitude : null,
      longitude: metadata && metadata.longitude !== undefined ? metadata.longitude : null
    });
  }

  scheduleBackgroundClustering();
  
  return true;
});

let backgroundClusteringTimer = null;

function scheduleBackgroundClustering() {
  if (backgroundClusteringTimer) {
    clearTimeout(backgroundClusteringTimer);
  }
  backgroundClusteringTimer = setTimeout(() => {
    runBackgroundClustering();
  }, 10000); // Wait 10 seconds after the last photo is synced
}

async function runBackgroundClustering() {
  if (!activeDeviceDb) return;
  console.log("[Background] Starting silent clustering for all cached embeddings...");
  
  const sabIndices = [];
  const validImages = [];
  
  await new Promise((resolve) => {
    activeDeviceDb.all(
      `SELECT id, name, path, type, size, predictions, latitude, longitude FROM resources WHERE type = 'images' OR type = 'thumbnail' OR type = 'album_photo'`,
      (err, rows) => {
        if (!err && rows) {
          for (const row of rows) {
             const idx = taskManager.getExistingSabIndex(row.path);
             if (idx !== -1) {
               sabIndices.push(idx);
               validImages.push(row);
             }
          }
        }
        resolve();
      }
    );
  });
  
  if (sabIndices.length === 0) return;

  try {
    const groups = await taskManager.clusterImages(sabIndices, validImages, 0.90);
    console.log(`[Background] Computed ${groups.length} clusters. Updating database...`);
    
    const crypto = require('crypto');
    const allUpdates = [];
    for (const group of groups) {
      const clusterId = crypto.randomUUID();
      for (const img of group.images) {
        allUpdates.push({ clusterId, imgId: img.id });
      }
    }

    const BATCH_SIZE = 200;
    for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) {
      const chunk = allUpdates.slice(i, i + BATCH_SIZE);
      await new Promise((resolve, reject) => {
        activeDeviceDb.serialize(() => {
          activeDeviceDb.run("BEGIN TRANSACTION");
          const stmt = activeDeviceDb.prepare(`UPDATE resources SET cluster_id = ? WHERE id = ?`);
          for (const item of chunk) {
            stmt.run([item.clusterId, item.imgId]);
          }
          stmt.finalize();
          activeDeviceDb.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      // Yield to event loop between chunks so WebRTC DataChannel heartbeats process smoothly
      await new Promise(r => setTimeout(r, 50));
    }
    console.log("[Background] Silent clustering completed and saved to database.");
  } catch (err) {
    console.error("[Background] Silent clustering failed:", err);
  }
}

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

    if (!textEncoderSession || !tokenizer) {
      throw new Error("AI models are not fully initialized. Cannot perform search.");
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
    const inputName = textEncoderSession.inputNames[0];
    const feeds = {};
    feeds[inputName] = tensor;
    const outputs = await textEncoderSession.run(feeds);
    const outputName = textEncoderSession.outputNames[0];
    const textFeatures = outputs[outputName].data; // Float32Array (512-dim)
    
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

    // 6. Delegate search to TaskManager (WASM SIMD)
    const validImages = [];
    for (const imagePath of imagePaths) {
      // Find SAB index for fast SIMD comparison
      const sabIdx = taskManager.getExistingSabIndex(imagePath);
      validImages.push({ path: imagePath, sabIdx: sabIdx !== -1 ? sabIdx : -1 });
    }

    const results = await taskManager.searchImages(queryEmbedding, validImages);
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
    console.error(`[UDP Service Error]: ${err.stack}`);
    try { udpSocket.close(); } catch (_) {}
    udpSocket = null;
  });

  udpSocket.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.sender_uuid === getComputerUuid() || data.from_uuid === getComputerUuid()) {
        return;
      }
      if (data.type === 'ShareCLIP_Discovery') {
        if (data.device_uuid === getComputerUuid()) return;

        const isNew = !discoveredDevices.has(data.device_uuid);
        discoveredDevices.set(data.device_uuid, {
          uuid: data.device_uuid,
          name: data.device_name,
          ip: rinfo.address,
          type: data.device_type || 'PC',
          lastSeen: Date.now(),
          sessionId: data.session_id
        });

        if (isNew) {
          console.log(`[UDP Message] Discovered peer '${data.device_name || 'Device'}' (${data.device_type || 'Device'}) at ${rinfo.address}:${rinfo.port} (UUID: ${data.device_uuid})`);
        }
        notifyDiscoveredDevices();
      } else if (data.type === 'ShareCLIP_Connect_Request') {
        console.log(`[UDP Message] Received Connection Request from ${rinfo.address}:${rinfo.port} (Name: ${data.from_name}, UUID: ${data.from_uuid})`);
        if (mainWindow) {
          mainWindow.webContents.send('connection-request', {
            uuid: data.from_uuid,
            name: data.from_name,
            ip: rinfo.address
          });
        }
      } else if (data.type === 'ShareCLIP_Connect_Response') {
        console.log(`[UDP Message] Received Connection Response from ${rinfo.address}:${rinfo.port} (Accepted: ${data.accept})`);
        if (mainWindow) {
          mainWindow.webContents.send('connection-response', {
            ip: rinfo.address,
            accept: data.accept,
            sdp: data.sdp
          });
        }
      } else if (data.type === 'ShareCLIP_Direct_Sdp') {
        console.log(`[UDP Message] Received Direct SDP (${data.sdpType}) from ${rinfo.address}:${rinfo.port}`);
        if (mainWindow) {
          mainWindow.webContents.send('direct-sdp-received', {
            ip: rinfo.address,
            sdp: data.sdp,
            sdpType: data.sdpType
          });
        }
      } else if (data.type === 'ShareCLIP_Direct_Ice') {
        console.log(`[UDP Message] Received Direct ICE Candidate from ${rinfo.address}:${rinfo.port}`);
        if (mainWindow) {
          mainWindow.webContents.send('direct-ice-received', {
            ip: rinfo.address,
            candidate: data.candidate
          });
        }
      } else {
        console.log(`[UDP Message] Received unknown packet type '${data.type}' from ${rinfo.address}:${rinfo.port}`);
      }
    } catch (e) {
      console.warn(`[UDP Message] Raw non-JSON packet received from ${rinfo.address}:${rinfo.port}`);
    }
  });

  udpSocket.on('listening', () => {
    try {
      udpSocket.setBroadcast(true);
    } catch (e) {
      console.error("[UDP Service] Failed to set broadcast:", e);
    }
    const address = udpSocket.address();
    const validIps = getValidPhysicalIps();
    const broadcastTargets = getBroadcastAddresses();
    console.log(`[UDP Service] Listening on ${address.address}:${address.port}`);
    console.log(`[UDP Service] Local Physical IPv4 Address(es): [${validIps.join(', ')}]`);
    console.log(`[UDP Service] Target Broadcast Address(es): [${broadcastTargets.join(', ')}]`);
  });

  try {
    udpSocket.bind(15185);
  } catch (e) {
    console.error("[UDP Service] Bind failed:", e);
  }

  // Start timers
  setInterval(broadcastDiscovery, 3000);
  setInterval(pruneDiscoveryList, 5000);
}

function isVirtualAdapter(name) {
  const lower = name.toLowerCase();
  return (
    lower.includes('vmware') ||
    lower.includes('virtualbox') ||
    lower.includes('vethernet') ||
    lower.includes('wsl') ||
    lower.includes('docker') ||
    lower.includes('tap') ||
    lower.includes('tun') ||
    lower.includes('wintun') ||
    lower.includes('wireguard') ||
    lower.includes('wg') ||
    lower.includes('zerotier') ||
    lower.includes('tailscale') ||
    lower.includes('vpn') ||
    lower.includes('pseudo') ||
    lower.includes('host-only') ||
    lower.includes('npcap') ||
    lower.includes('loopback') ||
    lower.includes('bluetooth') ||
    lower.includes('hyper-v')
  );
}

function getValidPhysicalIps() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const physicalIps = [];
  const fallbackIps = [];

  for (const name of Object.keys(interfaces)) {
    const isVirtual = isVirtualAdapter(name);
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('169.254.')) continue;
        if (!isVirtual) {
          physicalIps.push(iface.address);
        } else {
          fallbackIps.push(iface.address);
        }
      }
    }
  }

  return physicalIps.length > 0 ? physicalIps : fallbackIps;
}

function getBroadcastAddresses() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    if (isVirtualAdapter(name)) continue;
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('169.254.')) continue;
        const ipSplit = net.address.split('.');
        const maskSplit = net.netmask.split('.');
        
        const broadcastSplit = ipSplit.map((octet, index) => {
          return (parseInt(octet, 10) | (~parseInt(maskSplit[index], 10) & 255)).toString();
        });
        
        addresses.push(broadcastSplit.join('.'));
      }
    }
  }
  
  addresses.push('255.255.255.255');
  return [...new Set(addresses)];
}

let isWebRtcConnected = false;

ipcMain.handle('set-sync-status', (event, { status, deviceUuid }) => {
  if (status === 'connected') {
    isWebRtcConnected = true;
    if (deviceUuid) activeDeviceUuid = deviceUuid;
    console.log(`[Sync Status] Active device set: ${activeDeviceUuid}`);
  } else {
    isWebRtcConnected = false;
    activeDeviceUuid = null;
    stopPcHeartbeat();
    console.log(`[Sync Status] Disconnected. Resuming UDP discovery broadcast immediately.`);
    broadcastDiscovery();
  }
});

function broadcastDiscovery() {
  if (!udpSocket) return;
  // Stop discovery broadcast ONLY when WebRTC is actively connected right now!
  if (isWebRtcConnected && activeDeviceUuid) return;

  const hostname = require('os').hostname();
  const payload = JSON.stringify({
    type: 'ShareCLIP_Discovery',
    device_uuid: getComputerUuid(),
    device_name: hostname,
    device_type: 'PC',
    session_id: pcSessionId
  });

  const message = Buffer.from(payload);
  const targets = getBroadcastAddresses();
  for (const ip of targets) {
    try {
      udpSocket.send(message, 0, message.length, 15185, ip, (err) => {
        if (err) {
          // Suppress broadcast network-unreachable warnings
        }
      });
    } catch (e) {
      // Suppress network errors
    }
  }
}

function pruneDiscoveryList() {
  if (isWebRtcConnected && activeDeviceUuid) return;
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

let notifyDevicesTimer = null;
function notifyDiscoveredDevices() {
  if (notifyDevicesTimer) return;
  notifyDevicesTimer = setTimeout(() => {
    notifyDevicesTimer = null;
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      const list = Array.from(discoveredDevices.values());
      mainWindow.webContents.send('discovered-devices', list);
    }
  }, 400);
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
    // Retransmit 3 times to ensure Wi-Fi packet drops do not stall pairing
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        udpSocket.send(message, 0, message.length, 15185, ip, () => {});
      }, i * 80);
    }
    resolve(true);
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
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        udpSocket.send(message, 0, message.length, 15185, ip, () => {});
      }, i * 80);
    }
    resolve(true);
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
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        udpSocket.send(message, 0, message.length, 15185, ip, () => {});
      }, i * 80);
    }
    resolve(true);
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
    udpSocket.send(message, 0, message.length, 15185, ip, () => {});
    setTimeout(() => {
      if (udpSocket) {
        udpSocket.send(message, 0, message.length, 15185, ip, () => {});
      }
    }, 50);
    resolve(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// 🌐 HIGH-SPEED HTTP / TCP SIGNALING SERVER (FOR NON-BLE & LOW-END PCS)
// ─────────────────────────────────────────────────────────────────
const http = require('http');
let httpServer = null;
let httpSignalingPort = 15186;
const pendingSignalRequests = new Map(); // reqId -> res

function startHttpSignalingServer() {
  if (httpServer) return;

  httpServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const clientIp = req.socket.remoteAddress ? req.socket.remoteAddress.replace(/^.*:/, '') : 'unknown';

    if (req.method === 'GET' && (url.pathname === '/ping' || url.pathname === '/api/status')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        device_name: require('os').hostname(),
        device_uuid: getComputerUuid(),
        session_id: pcSessionId,
        http_port: httpSignalingPort,
      }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/signal') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 512 * 1024) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
        }
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const reqId = 'sig_' + Math.random().toString(36).substring(2, 11);
          console.log(`[HTTP Signaling] Received ${data.type || 'offer'} from ${clientIp} (ReqId: ${reqId})`);

          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
            pendingSignalRequests.set(reqId, res);
            setTimeout(() => {
              if (pendingSignalRequests.has(reqId)) {
                pendingSignalRequests.delete(reqId);
                if (!res.writableEnded) {
                  res.writeHead(504, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'Signaling timeout' }));
                }
              }
            }, 8000);

            mainWindow.webContents.send('http-signal-received', {
              reqId,
              ip: clientIp,
              type: data.type || 'offer',
              sdp: data.sdp,
              candidates: data.candidates || []
            });
          } else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'PC window not ready' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/ice') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
            mainWindow.webContents.send('direct-ice-received', {
              ip: clientIp,
              candidate: typeof data.candidate === 'string' ? data.candidate : JSON.stringify(data.candidate)
            });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  httpServer.on('error', (err) => {
    console.error(`[HTTP Signaling Server Error]: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
      httpSignalingPort++;
      console.log(`[HTTP Signaling Server] Port busy, retrying port ${httpSignalingPort}...`);
      httpServer.listen(httpSignalingPort);
    }
  });

  httpServer.listen(httpSignalingPort, () => {
    console.log(`[HTTP Signaling Server] Listening on http://0.0.0.0:${httpSignalingPort}`);
  });
}

ipcMain.handle('respond-http-signal', (event, { reqId, success, sdp, candidates, error }) => {
  const res = pendingSignalRequests.get(reqId);
  if (res) {
    pendingSignalRequests.delete(reqId);
    if (!res.writableEnded) {
      if (success) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, sdp, candidates: candidates || [] }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error || 'Failed to generate answer' }));
      }
    }
  }
  return true;
});

ipcMain.handle('get-http-signaling-port', () => {
  return httpSignalingPort;
});

// ==================== VIDEO ANIMEGAN TRANSFORMATION IPCS ====================
const VideoAnimeConverter = require('./src/workers/video-anime-converter.cjs');
let activeAnimeConverter = null;

function resolveFFmpegPaths() {
  const isWin = process.platform === 'win32';
  const ffmpegExe = isWin ? 'ffmpeg.exe' : 'ffmpeg';
  const ffprobeExe = isWin ? 'ffprobe.exe' : 'ffprobe';

  const candidateDirs = [
    path.join(process.resourcesPath || __dirname, 'bin'),
    path.join(__dirname, 'bin'),
    path.join(process.resourcesPath || __dirname),
    path.join(__dirname),
    path.join(typeof app !== 'undefined' && app.getAppPath ? app.getAppPath() : __dirname, 'bin')
  ];

  if (isWin) {
    if (process.env.LOCALAPPDATA) {
      candidateDirs.push(
        path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links'),
        path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages')
      );
    }
    if (process.env.USERPROFILE) {
      candidateDirs.push(
        path.join(process.env.USERPROFILE, 'scoop', 'shims'),
        path.join(process.env.USERPROFILE, 'scoop', 'apps', 'ffmpeg', 'current', 'bin')
      );
    }
    candidateDirs.push(
      'C:\\ProgramData\\chocolatey\\bin',
      'C:\\ffmpeg\\bin',
      'C:\\Program Files\\ffmpeg\\bin'
    );
  }

  let resolvedFfmpeg = null;
  let resolvedFfprobe = null;

  for (const dir of candidateDirs) {
    if (!resolvedFfmpeg) {
      const f = path.join(dir, ffmpegExe);
      if (fs.existsSync(f)) resolvedFfmpeg = f;
    }
    if (!resolvedFfprobe) {
      const f = path.join(dir, ffprobeExe);
      if (fs.existsSync(f)) resolvedFfprobe = f;
    }
  }

  return {
    ffmpegPath: resolvedFfmpeg || (process.env.FFMPEG_PATH || 'ffmpeg'),
    ffprobePath: resolvedFfprobe || (process.env.FFPROBE_PATH || 'ffprobe')
  };
}

function resolveAnimeModelPath(style) {
  const filename = `animegan_${style}.onnx`;
  const candidates = [
    path.join(__dirname, filename),
    path.join(process.resourcesPath || __dirname, filename),
    path.join(process.resourcesPath || __dirname, 'app.asar.unpacked', filename),
    path.join(typeof app !== 'undefined' && app.getAppPath ? app.getAppPath() : __dirname, filename)
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, filename);
}

ipcMain.handle('video-anime:check-env', async () => {
  const { ffmpegPath, ffprobePath } = resolveFFmpegPaths();
  const styles = ['hayao', 'shinkai', 'paprika', 'portrait'];
  const modelStatus = {};
  for (const s of styles) {
    const p = resolveAnimeModelPath(s);
    modelStatus[s] = fs.existsSync(p);
  }

  const cp = require('child_process');
  let ffprobeReady = false;
  try {
    await new Promise((resolve, reject) => {
      const p = cp.spawn(ffprobePath, ['-version']);
      p.on('close', code => code === 0 ? resolve() : reject());
      p.on('error', reject);
    });
    ffprobeReady = true;
  } catch (_) {
    ffprobeReady = false;
  }

  let ffmpegReady = false;
  try {
    await new Promise((resolve, reject) => {
      const p = cp.spawn(ffmpegPath, ['-version']);
      p.on('close', code => code === 0 ? resolve() : reject());
      p.on('error', reject);
    });
    ffmpegReady = true;
  } catch (_) {
    ffmpegReady = false;
  }

  return {
    success: true,
    ffmpegReady: ffmpegReady && ffprobeReady,
    ffmpegPath,
    ffprobePath,
    modelStatus
  };
});

ipcMain.handle('video-anime:get-info', async (event, videoPath) => {
  try {
    const { ffmpegPath, ffprobePath } = resolveFFmpegPaths();
    const converter = new VideoAnimeConverter({ ffmpegPath, ffprobePath });
    const info = await converter.probeVideo(videoPath);
    return { success: true, data: info };
  } catch (err) {
    console.error('[Video Anime] Probe metadata failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('video-anime:get-styles', async () => {
  return [
    { 
      id: 'hayao', 
      name: '🍃 宫崎骏·吉卜力风 (Hayao)', 
      desc: '清新手绘、自然治愈、高饱和绿意光影', 
      icon: '🍃',
      previewGradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    { 
      id: 'shinkai', 
      name: '✨ 新海诚·唯美光影风 (Shinkai)', 
      desc: '秒速五厘米/天气之子浪漫蓝紫云霞光晕', 
      icon: '✨',
      previewGradient: 'linear-gradient(135deg, #38bdf8, #818cf8)'
    },
    { 
      id: 'paprika', 
      name: '🌸 今敏·红辣椒浓烈奇幻风 (Paprika)', 
      desc: '浓厚色彩胶片质感、极具视觉冲击力', 
      icon: '🌸',
      previewGradient: 'linear-gradient(135deg, #f43f5e, #e11d48)'
    },
    { 
      id: 'portrait', 
      name: '🎨 二次元人像重绘 (Portrait V3)', 
      desc: '人脸五官精细动漫化、适合人物特写', 
      icon: '🎨',
      previewGradient: 'linear-gradient(135deg, #a855f7, #ec4899)'
    }
  ];
});

ipcMain.handle('video-anime:start', async (event, params) => {
  const { inputPath, outputPath, style = 'hayao', maxDimension = 480, frameRateMode = 'anime15' } = params;
  try {
    if (activeAnimeConverter) {
      activeAnimeConverter.cancel();
    }

    const { ffmpegPath, ffprobePath } = resolveFFmpegPaths();
    activeAnimeConverter = new VideoAnimeConverter({ ffmpegPath, ffprobePath });

    const modelPath = resolveAnimeModelPath(style);
    if (!fs.existsSync(modelPath)) {
      throw new Error(`画风模型文件 animegan_${style}.onnx 未找到，请检查模型完整性`);
    }

    const result = await activeAnimeConverter.convert({
      inputPath,
      outputPath,
      modelPath,
      maxDimension,
      frameRateMode
    }, (progressData) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('video-anime:progress', progressData);
      }
    });

    activeAnimeConverter = null;
    return { success: true, data: result };
  } catch (err) {
    console.error('[Video Anime] Transform failed:', err);
    activeAnimeConverter = null;
    return { success: false, error: err.message };
  }
});

ipcMain.handle('video-anime:cancel', async () => {
  if (activeAnimeConverter) {
    activeAnimeConverter.cancel();
    activeAnimeConverter = null;
    return { success: true };
  }
  return { success: false, message: 'No active conversion task' };
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

