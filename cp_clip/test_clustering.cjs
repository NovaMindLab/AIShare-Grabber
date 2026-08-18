const tm = require('./src/workers/task-manager.cjs');

// fake initialization
tm.init('fake/model/path');

setTimeout(async () => {
  try {
    // Add fake embeddings
    const fakeEmbedding1 = new Float32Array(512).fill(0.1);
    const fakeEmbedding2 = new Float32Array(512).fill(0.1); // exactly the same
    const fakeEmbedding3 = new Float32Array(512).fill(-0.1); // opposite

    tm.addEmbeddingToSAB('img1.jpg', fakeEmbedding1);
    tm.addEmbeddingToSAB('img2.jpg', fakeEmbedding2);
    tm.addEmbeddingToSAB('img3.jpg', fakeEmbedding3);

    const sabIndices = [0, 1, 2];
    const validImages = [
      { id: 'img1', path: 'img1.jpg', size: 100 },
      { id: 'img2', path: 'img2.jpg', size: 200 },
      { id: 'img3', path: 'img3.jpg', size: 300 }
    ];

    console.log("Sending cluster request...");
    const groups = await tm.clusterImages(sabIndices, validImages, 0.8);
    console.log("Groups:", JSON.stringify(groups, null, 2));
    
    // Add fake faces
    tm.addFaceEmbeddingToSAB('face1', fakeEmbedding1);
    tm.addFaceEmbeddingToSAB('face2', fakeEmbedding2);
    
    const faceSabIndices = [0, 1];
    const validFaces = [
      { id: 'face1', path: 'img1.jpg' },
      { id: 'face2', path: 'img2.jpg' }
    ];
    
    console.log("Sending face cluster request...");
    const faceGroups = await tm.clusterFaces(faceSabIndices, validFaces, 0.65);
    console.log("Face Groups:", JSON.stringify(faceGroups, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}, 1000);
