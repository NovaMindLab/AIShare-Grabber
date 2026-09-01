const taskManager = require('./src/workers/task-manager.cjs');
const path = require('path');
const fs = require('fs');

// Helper to generate a random unit vector of dimension 512
function createRandomUnitVector(dim = 512) {
  const vec = new Float32Array(dim);
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    vec[i] = (Math.random() - 0.5);
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  for (let i = 0; i < dim; i++) {
    vec[i] /= norm;
  }
  return vec;
}

// Helper to create an orthogonal vector to a given base vector
function createOrthogonalUnitVector(base, dim = 512) {
  const rand = createRandomUnitVector(dim);
  let dot = 0;
  for (let i = 0; i < dim; i++) dot += base[i] * rand[i];
  const ortho = new Float32Array(dim);
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    ortho[i] = rand[i] - dot * base[i];
    norm += ortho[i] * ortho[i];
  }
  norm = Math.sqrt(norm);
  for (let i = 0; i < dim; i++) ortho[i] /= norm;
  return ortho;
}

// Helper to create realistic normalized face embedding with identity + pose variation
function createFaceEmbedding(identityVec, poseVec = null, noiseStrength = 0.05) {
  const dim = identityVec.length;
  const vec = new Float32Array(dim);
  const noise = createRandomUnitVector(dim);
  for (let i = 0; i < dim; i++) {
    vec[i] = identityVec[i] + (poseVec ? poseVec[i] : 0) + noiseStrength * noise[i];
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  for (let i = 0; i < dim; i++) vec[i] /= norm;
  return vec;
}

function dotProduct(v1, v2) {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) sum += v1[i] * v2[i];
  return sum;
}

async function runFaceClusteringTests() {
  console.log("================================================================");
  console.log("   ShareCLIP Two-Stage Face Recognition Clustering Test Suite   ");
  console.log("================================================================\n");

  taskManager.init(null, null, null);

  // Wait for worker pool to initialize
  await new Promise(r => setTimeout(r, 600));

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
    }
  }

  // -------------------------------------------------------------
  // Test Scenario 1: Multi-Pose Same Person (Jackie Chan) Merge
  // -------------------------------------------------------------
  console.log("--- Test 1: Multi-Pose Same Person (Jackie Chan) Across Photos ---");
  const jackieIdentity = createRandomUnitVector(512);
  const jackieYawAxis = createOrthogonalUnitVector(jackieIdentity);

  // Scale pose vectors along the yaw axis to simulate multi-angle shots
  const pose_0deg = null;
  const pose_20deg = new Float32Array(512);
  const pose_40deg = new Float32Array(512);
  const pose_60deg = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    pose_20deg[i] = 0.4 * jackieYawAxis[i];
    pose_40deg[i] = 0.8 * jackieYawAxis[i];
    pose_60deg[i] = 1.2 * jackieYawAxis[i];
  }

  const emb_j1 = createFaceEmbedding(jackieIdentity, pose_0deg);
  const emb_j2 = createFaceEmbedding(jackieIdentity, pose_20deg);
  const emb_j3 = createFaceEmbedding(jackieIdentity, pose_40deg);
  const emb_j4 = createFaceEmbedding(jackieIdentity, pose_60deg);

  console.log(`  Similarity (Front vs 20deg): ${dotProduct(emb_j1, emb_j2).toFixed(3)}`);
  console.log(`  Similarity (20deg vs 40deg): ${dotProduct(emb_j2, emb_j3).toFixed(3)}`);
  console.log(`  Similarity (40deg vs 60deg): ${dotProduct(emb_j3, emb_j4).toFixed(3)}`);
  console.log(`  Similarity (Front vs 60deg): ${dotProduct(emb_j1, emb_j4).toFixed(3)}`);

  const sIdx_j1 = taskManager.addFaceEmbeddingToSAB('face_j1', emb_j1);
  const sIdx_j2 = taskManager.addFaceEmbeddingToSAB('face_j2', emb_j2);
  const sIdx_j3 = taskManager.addFaceEmbeddingToSAB('face_j3', emb_j3);
  const sIdx_j4 = taskManager.addFaceEmbeddingToSAB('face_j4', emb_j4);

  const jackieFaces = [
    { id: 'face_j1', path: 'photo_j1.jpg', bbox: [10, 10, 50, 50] },
    { id: 'face_j2', path: 'photo_j2.jpg', bbox: [20, 20, 120, 120] }, // Largest bbox: 14400 area
    { id: 'face_j3', path: 'photo_j3.jpg', bbox: [15, 15, 80, 80] },
    { id: 'face_j4', path: 'photo_j4.jpg', bbox: [30, 30, 60, 60] }
  ];
  const jackieIndices = [sIdx_j1, sIdx_j2, sIdx_j3, sIdx_j4];

  const jackieClusters = await taskManager.clusterFaces(jackieIndices, jackieFaces, 0.44);
  console.log(`  Result: ${jackieClusters.length} cluster(s) formed.`);

  assert(
    jackieClusters.length === 1 && jackieClusters[0].face_count === 4,
    "Jackie Chan 4 pose variations merge into exactly 1 cluster",
    `Expected 1 cluster with 4 faces, got ${jackieClusters.length} clusters: ${JSON.stringify(jackieClusters.map(c => c.face_count))}`
  );

  assert(
    jackieClusters[0].cover_face_id === 'face_j2',
    "Cover portrait chooses the largest face bbox (face_j2 with 120x120)",
    `Expected face_j2, got ${jackieClusters[0] ? jackieClusters[0].cover_face_id : 'none'}`
  );

  // -------------------------------------------------------------
  // Test Scenario 2: Multi-Person Separation (Jackie Chan vs Jet Li vs Donnie Yen)
  // -------------------------------------------------------------
  console.log("\n--- Test 2: Multi-Person Separation (Jackie Chan, Jet Li, Donnie Yen) ---");
  const jetliIdentity = createOrthogonalUnitVector(jackieIdentity);
  const jetliYaw = createOrthogonalUnitVector(jetliIdentity);
  const pose_l1 = null;
  const pose_l2 = new Float32Array(512);
  const pose_l3 = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    pose_l2[i] = 0.5 * jetliYaw[i];
    pose_l3[i] = 0.9 * jetliYaw[i];
  }
  const emb_jetli_1 = createFaceEmbedding(jetliIdentity, pose_l1);
  const emb_jetli_2 = createFaceEmbedding(jetliIdentity, pose_l2);
  const emb_jetli_3 = createFaceEmbedding(jetliIdentity, pose_l3);

  const donnieIdentity = createOrthogonalUnitVector(jackieIdentity);
  const donnieYaw = createOrthogonalUnitVector(donnieIdentity);
  const pose_d2 = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    pose_d2[i] = 0.5 * donnieYaw[i];
  }
  const emb_donnie_1 = createFaceEmbedding(donnieIdentity, null);
  const emb_donnie_2 = createFaceEmbedding(donnieIdentity, pose_d2);

  const sIdx_l1 = taskManager.addFaceEmbeddingToSAB('face_l1', emb_jetli_1);
  const sIdx_l2 = taskManager.addFaceEmbeddingToSAB('face_l2', emb_jetli_2);
  const sIdx_l3 = taskManager.addFaceEmbeddingToSAB('face_l3', emb_jetli_3);

  const sIdx_d1 = taskManager.addFaceEmbeddingToSAB('face_d1', emb_donnie_1);
  const sIdx_d2 = taskManager.addFaceEmbeddingToSAB('face_d2', emb_donnie_2);

  const allPeopleFaces = [
    ...jackieFaces,
    { id: 'face_l1', path: 'photo_l1.jpg', bbox: [10, 10, 70, 70] },
    { id: 'face_l2', path: 'photo_l2.jpg', bbox: [10, 10, 90, 90] },
    { id: 'face_l3', path: 'photo_l3.jpg', bbox: [10, 10, 60, 60] },
    { id: 'face_d1', path: 'photo_d1.jpg', bbox: [10, 10, 100, 100] },
    { id: 'face_d2', path: 'photo_d2.jpg', bbox: [10, 10, 80, 80] }
  ];
  const allPeopleIndices = [
    ...jackieIndices,
    sIdx_l1, sIdx_l2, sIdx_l3,
    sIdx_d1, sIdx_d2
  ];

  const multiClusters = await taskManager.clusterFaces(allPeopleIndices, allPeopleFaces, 0.44);
  console.log(`  Multi-person clusters formed: ${multiClusters.length}`);
  multiClusters.forEach((c, idx) => {
    console.log(`    Cluster ${c.id} (${c.name}): ${c.face_count} faces, cover: ${c.cover_face_id}`);
  });

  assert(
    multiClusters.length === 3,
    "3 distinct people form exactly 3 clusters",
    `Expected 3 clusters, got ${multiClusters.length}`
  );

  assert(
    multiClusters[0].face_count === 4 && multiClusters[1].face_count === 3 && multiClusters[2].face_count === 2,
    "Clusters are sorted by face_count descending (4, 3, 2)",
    `Got counts: ${multiClusters.map(c => c.face_count).join(', ')}`
  );

  assert(
    multiClusters[0].id === 'person_001' && multiClusters[0].name === '人物 1' &&
    multiClusters[1].id === 'person_002' && multiClusters[1].name === '人物 2' &&
    multiClusters[2].id === 'person_003' && multiClusters[2].name === '人物 3',
    "Cluster IDs and names are re-indexed in descending rank order",
    `Got IDs: ${multiClusters.map(c => c.id).join(', ')}`
  );

  // -------------------------------------------------------------
  // Test Scenario 3: Same-Photo Exclusion Hard Constraint
  // -------------------------------------------------------------
  console.log("\n--- Test 3: Same-Photo Exclusion (Two faces in same photo) ---");
  const emb_photo_a = createFaceEmbedding(jackieIdentity, pose_20deg);
  const emb_photo_b = createFaceEmbedding(jackieIdentity, pose_40deg); // High similarity with A, but in SAME photo

  const sIdx_pA = taskManager.addFaceEmbeddingToSAB('face_pA', emb_photo_a);
  const sIdx_pB = taskManager.addFaceEmbeddingToSAB('face_pB', emb_photo_b);

  const samePhotoFaces = [
    { id: 'face_pA', path: 'group_photo.jpg', bbox: [10, 10, 50, 50] },
    { id: 'face_pB', path: 'group_photo.jpg', bbox: [100, 10, 50, 50] } // same path 'group_photo.jpg'
  ];
  const samePhotoIndices = [sIdx_pA, sIdx_pB];

  const samePhotoClusters = await taskManager.clusterFaces(samePhotoIndices, samePhotoFaces, 0.44);
  console.log(`  Same-photo clusters formed: ${samePhotoClusters.length}`);

  assert(
    samePhotoClusters.length === 2,
    "Faces in the same photo cannot belong to the same cluster (Same-Photo Exclusion)",
    `Expected 2 separate clusters, got ${samePhotoClusters.length}`
  );

  // -------------------------------------------------------------
  // Test Scenario 4: Agglomerative Stage 2 Inter-Cluster Merge
  // -------------------------------------------------------------
  console.log("\n--- Test 4: Agglomerative Stage 2 Merge across separate sub-groups ---");
  // Subgroup 1: Looking left poses (poses -0.5, -0.2)
  // Subgroup 2: Looking right poses (poses +0.2, +0.5)
  const pose_left1 = new Float32Array(512);
  const pose_left2 = new Float32Array(512);
  const pose_right1 = new Float32Array(512);
  const pose_right2 = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    pose_left1[i] = -0.5 * jackieYawAxis[i];
    pose_left2[i] = -0.2 * jackieYawAxis[i];
    pose_right1[i] = 0.2 * jackieYawAxis[i];
    pose_right2[i] = 0.5 * jackieYawAxis[i];
  }

  const emb_c1 = createFaceEmbedding(jackieIdentity, pose_left1);
  const emb_c2 = createFaceEmbedding(jackieIdentity, pose_left2);
  const emb_c3 = createFaceEmbedding(jackieIdentity, pose_right1);
  const emb_c4 = createFaceEmbedding(jackieIdentity, pose_right2);

  const sIdx_c1 = taskManager.addFaceEmbeddingToSAB('face_c1', emb_c1);
  const sIdx_c2 = taskManager.addFaceEmbeddingToSAB('face_c2', emb_c2);
  const sIdx_c3 = taskManager.addFaceEmbeddingToSAB('face_c3', emb_c3);
  const sIdx_c4 = taskManager.addFaceEmbeddingToSAB('face_c4', emb_c4);

  const aggFaces = [
    { id: 'face_c1', path: 'img_c1.jpg', bbox: [10, 10, 50, 50] },
    { id: 'face_c2', path: 'img_c2.jpg', bbox: [10, 10, 50, 50] },
    { id: 'face_c3', path: 'img_c3.jpg', bbox: [10, 10, 50, 50] },
    { id: 'face_c4', path: 'img_c4.jpg', bbox: [10, 10, 50, 50] }
  ];
  const aggIndices = [sIdx_c1, sIdx_c2, sIdx_c3, sIdx_c4];

  const aggClusters = await taskManager.clusterFaces(aggIndices, aggFaces, 0.44);
  console.log(`  Agglomerative Merge result: ${aggClusters.length} cluster(s) formed.`);

  assert(
    aggClusters.length === 1 && aggClusters[0].face_count === 4,
    "Stage 2 agglomerative merge unifies all sub-clusters of the same person",
    `Expected 1 cluster with 4 faces, got ${aggClusters.length}`
  );

  // -------------------------------------------------------------
  // Test Scenario 5: Edge cases (empty array, single face, corrupted bbox)
  // -------------------------------------------------------------
  console.log("\n--- Test 5: Edge Cases (Empty array, Single face, Corrupted/missing BBox) ---");
  const emptyResult = await taskManager.clusterFaces([], [], 0.44);
  assert(
    Array.isArray(emptyResult) && emptyResult.length === 0,
    "Empty face list returns empty array safely"
  );

  const singleEmb = createRandomUnitVector(512);
  const sIdx_single = taskManager.addFaceEmbeddingToSAB('face_single', singleEmb);
  const singleFaces = [
    { id: 'face_single', path: 'single.jpg', bbox: "corrupted_bbox_json" }
  ];
  const singleResult = await taskManager.clusterFaces([sIdx_single], singleFaces, 0.44);
  assert(
    singleResult.length === 1 && singleResult[0].face_count === 1 && singleResult[0].cover_face_id === 'face_single',
    "Single face with corrupted bbox JSON handles gracefully and selects face as cover"
  );

  // -------------------------------------------------------------
  // Test Scenario 6: Real-world Unaligned Low-Similarity Variation (~0.44-0.48)
  // -------------------------------------------------------------
  console.log("\n--- Test 6: Real-World Challenging Unaligned Poses (~0.45 similarity) ---");
  const challengingId = createRandomUnitVector(512);
  const varAxis1 = createOrthogonalUnitVector(challengingId);
  const varAxis2 = createOrthogonalUnitVector(challengingId);

  // Create 3 photos with significant pose/lighting variation where pairwise similarities are ~0.46-0.48
  const p1 = new Float32Array(512);
  const p2 = new Float32Array(512);
  const p3 = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    p1[i] = 0.9 * varAxis1[i];
    p2[i] = 0.9 * varAxis2[i];
    p3[i] = -0.9 * varAxis1[i];
  }
  const emb_c_1 = createFaceEmbedding(challengingId, p1, 0.05);
  const emb_c_2 = createFaceEmbedding(challengingId, p2, 0.05);
  const emb_c_3 = createFaceEmbedding(challengingId, p3, 0.05);

  const s1 = dotProduct(emb_c_1, emb_c_2);
  const s2 = dotProduct(emb_c_2, emb_c_3);
  const s3 = dotProduct(emb_c_1, emb_c_3);
  console.log(`  Challenging Pairwise Similarities: ${s1.toFixed(3)}, ${s2.toFixed(3)}, ${s3.toFixed(3)}`);

  const sIdx_ch1 = taskManager.addFaceEmbeddingToSAB('face_ch1', emb_c_1);
  const sIdx_ch2 = taskManager.addFaceEmbeddingToSAB('face_ch2', emb_c_2);
  const sIdx_ch3 = taskManager.addFaceEmbeddingToSAB('face_ch3', emb_c_3);

  const challengingFaces = [
    { id: 'face_ch1', path: 'photo_ch1.jpg', bbox: [10, 10, 50, 50] },
    { id: 'face_ch2', path: 'photo_ch2.jpg', bbox: [10, 10, 50, 50] },
    { id: 'face_ch3', path: 'photo_ch3.jpg', bbox: [10, 10, 50, 50] }
  ];
  const challengingIndices = [sIdx_ch1, sIdx_ch2, sIdx_ch3];

  const challengingClusters = await taskManager.clusterFaces(challengingIndices, challengingFaces, 0.44);
  console.log(`  Challenging cluster result: ${challengingClusters.length} cluster(s) formed.`);

  assert(
    challengingClusters.length === 1 && challengingClusters[0].face_count === 3,
    "Challenging low-similarity face variations correctly merge via Centroid Linkage into 1 cluster",
    `Expected 1 cluster with 3 faces, got ${challengingClusters.length}`
  );

  console.log("\n================================================================");
  console.log(`Test Summary: ${passedTests} / ${totalTests} tests passed.`);
  console.log("================================================================\n");

  if (passedTests === totalTests) {
    console.log("🎉 ALL FACE CLUSTERING TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("⚠️ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runFaceClusteringTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
