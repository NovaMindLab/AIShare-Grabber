const { ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// We need to mock some things from main.cjs to test search logic directly
const { SimpleTokenizer } = require('./tokenizer.cjs');
const ort = require('onnxruntime-node');
let tokenizer = null;
let textEncoderSession = null;
let imageEmbeddingsCache = {};

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

async function runTest() {
  // Load Tokenizer
  const mergesText = fs.readFileSync(path.join(__dirname, 'merges.txt'), 'utf-8');
  tokenizer = new SimpleTokenizer(mergesText);
  
  // Load Text Encoder
  textEncoderSession = await ort.InferenceSession.create(path.join(__dirname, 'mobileclip2_s0_text_encoder_quant.onnx'), {
    executionProviders: ['cpu']
  });

  // Load a database
  const dbDir = path.join(process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.config"), 'cp_clip', 'sync_storage'); // wait we don't know the virtual UUID
  console.log("Appdata path: ", dbDir);

  // We can just simulate the query embedding!
  const queryText = "flower";
  const tokenIds = tokenizer.encodeForCLIP(queryText);
  const bigintData = new BigInt64Array(77);
  for (let i = 0; i < 77; i++) { bigintData[i] = BigInt(tokenIds[i]); }
  const tensor = new ort.Tensor('int64', bigintData, [1, 77]);
  
  const feeds = {};
  feeds[textEncoderSession.inputNames[0]] = tensor;
  const outputs = await textEncoderSession.run(feeds);
  const textFeatures = outputs[textEncoderSession.outputNames[0]].data;

  console.log("Text Features length:", textFeatures.length);
  console.log("Text Features sample:", textFeatures.slice(0, 5));
}

runTest().catch(console.error);
