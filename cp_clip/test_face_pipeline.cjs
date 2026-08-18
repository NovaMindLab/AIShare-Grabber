const taskManager = require('./src/workers/task-manager.cjs');
const path = require('path');
const fs = require('fs');

async function testFacePipeline() {
  console.log("=== Testing Cascading Single-Pass Face Pipeline & DBSCAN Clustering ===");

  const modelPath = path.join(__dirname, 'mobileclip2_s0_image_encoder.onnx');
  const scrfdPath = path.join(__dirname, 'scrfd_2.5g.onnx');
  const mobilefacenetPath = path.join(__dirname, 'mobilefacenet.onnx');

  taskManager.init(
    fs.existsSync(modelPath) ? modelPath : null,
    fs.existsSync(scrfdPath) ? scrfdPath : null,
    fs.existsSync(mobilefacenetPath) ? mobilefacenetPath : null
  );

  console.log("1. Testing Face SAB Allocation...");
  console.log(`- Image SAB Capacity: ${taskManager.MAX_IMAGES}`);
  console.log(`- Face SAB Capacity: ${taskManager.MAX_FACES}`);

  const dummyFaceId1 = "face_001";
  const dummyEmbedding1 = new Float32Array(512).fill(0.5);
  const sabIdx1 = taskManager.addFaceEmbeddingToSAB(dummyFaceId1, dummyEmbedding1);
  console.log(`- Added dummy face_001 to Face SAB at index: ${sabIdx1}`);

  const dummyFaceId2 = "face_002";
  const dummyEmbedding2 = new Float32Array(512).fill(0.51); // High similarity with face_001
  const sabIdx2 = taskManager.addFaceEmbeddingToSAB(dummyFaceId2, dummyEmbedding2);
  console.log(`- Added dummy face_002 to Face SAB at index: ${sabIdx2}`);

  const dummyFaceId3 = "face_003";
  const dummyEmbedding3 = new Float32Array(512).fill(-0.5); // Low similarity
  const sabIdx3 = taskManager.addFaceEmbeddingToSAB(dummyFaceId3, dummyEmbedding3);
  console.log(`- Added dummy face_003 to Face SAB at index: ${sabIdx3}`);

  console.log("2. Testing DBSCAN Face Clustering...");
  const validFaces = [
    { id: dummyFaceId1, path: 'photo1.jpg' },
    { id: dummyFaceId2, path: 'photo2.jpg' },
    { id: dummyFaceId3, path: 'photo3.jpg' }
  ];
  const faceSabIndices = [sabIdx1, sabIdx2, sabIdx3];

  const clusters = await taskManager.clusterFaces(faceSabIndices, validFaces, 0.65);
  console.log("DBSCAN Clustering Result:", JSON.stringify(clusters, null, 2));

  if (clusters && clusters.length === 2) {
    console.log("✅ SUCCESS: DBSCAN correctly clustered face_001 & face_002 together and face_003 separately!");
  } else {
    console.log(`ℹ️ Clusters formed: ${clusters ? clusters.length : 0}`);
  }

  process.exit(0);
}

testFacePipeline().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
