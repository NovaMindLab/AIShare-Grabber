const sqlite3 = require('sqlite3').verbose();
const ort = require('onnxruntime-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function test() {
  const syncStorage = path.join(__dirname, 'sync_storage');
  const dirs = fs.readdirSync(syncStorage).filter(d => fs.statSync(path.join(syncStorage, d)).isDirectory());
  
  if (dirs.length === 0) {
    console.log("No devices found.");
    return;
  }
  
  const dbPath = path.join(syncStorage, dirs[0], 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  // Find one image
  db.get("SELECT path, embedding FROM resources WHERE type='thumbnail' AND embedding IS NOT NULL LIMIT 1", async (err, row) => {
    if (err || !row) return console.log("No images found with embeddings");
    
    console.log("Found image in DB:", row.path);
    const dbEmbedding = new Float32Array(row.embedding.buffer);
    
    // Compute using ONNX
    const ortSession = await ort.InferenceSession.create(path.join(__dirname, 'mobileclip2_s0_image_encoder.onnx'));
    
    const { data } = await sharp(row.path)
      .resize(256, 256, { fit: 'cover', position: 'center' })
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const float32Data = new Float32Array(3 * 256 * 256);
    const imageSize = 256 * 256;
    for (let i = 0; i < imageSize; i++) {
      float32Data[i] = data[i * 3] / 255.0;
      float32Data[imageSize + i] = data[i * 3 + 1] / 255.0;
      float32Data[2 * imageSize + i] = data[i * 3 + 2] / 255.0;
    }
    
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, 256, 256]);
    const inputName = ortSession.inputNames[0];
    const feeds = { [inputName]: tensor };
    const outputs = await ortSession.run(feeds);
    const outputName = ortSession.outputNames[0];
    const newEmbedding = new Float32Array(outputs[outputName].data);
    
    // Compare
    let dotProduct = 0.0;
    let normDb = 0.0;
    let normNew = 0.0;
    for (let i = 0; i < 512; i++) {
      dotProduct += dbEmbedding[i] * newEmbedding[i];
      normDb += dbEmbedding[i] * dbEmbedding[i];
      normNew += newEmbedding[i] * newEmbedding[i];
    }
    const cosSim = dotProduct / (Math.sqrt(normDb) * Math.sqrt(normNew));
    console.log("Cosine Similarity between DB embedding and newly computed embedding:", cosSim);
    if (cosSim < 0.9) {
      console.log("CONCLUSION: The database holds stale (v1) embeddings. Reclassification is needed or still in progress.");
    } else {
      console.log("CONCLUSION: The database holds fresh embeddings.");
    }
  });
}

test();
