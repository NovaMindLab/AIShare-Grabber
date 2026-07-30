const { parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');

let wasmInstImages = null;
let wasmInstFaces = null;

parentPort.on('message', async (msg) => {
  if (msg.type === 'init') {
    try {
      const wasmPath = path.join(__dirname, 'simd_math.wasm');
      const wasmBytes = fs.readFileSync(wasmPath);

      if (msg.wasmMemImages) {
        const { instance } = await WebAssembly.instantiate(wasmBytes, { env: { memory: msg.wasmMemImages } });
        wasmInstImages = instance;
        console.log("[Search Worker] Mounted WASM SIMD for Images successfully.");
      }
      if (msg.wasmMemFaces) {
        const { instance } = await WebAssembly.instantiate(wasmBytes, { env: { memory: msg.wasmMemFaces } });
        wasmInstFaces = instance;
        console.log("[Search Worker] Mounted WASM SIMD for Faces successfully.");
      }
      parentPort.postMessage({ type: 'init_result', success: true });
    } catch (err) {
      console.error("[Search Worker] Init Error:", err);
      parentPort.postMessage({ type: 'init_result', success: false, error: err.message });
    }
    return;
  }

  if (msg.type === 'cluster') {
    const { reqId, sabIndices, validImages, threshold } = msg.payload;

    try {
      if (!wasmInstImages) {
        throw new Error("WASM Image SIMD not mounted");
      }

      const n = validImages.length;
      const clusterGroups = []; // Array of arrays: [ [idx0, idx1...], [idx2...] ]

      // Perform Leader (Centroid) Clustering
      for (let i = 0; i < n; i++) {
        let bestGroupIdx = -1;
        let bestSim = -1;

        for (let g = 0; g < clusterGroups.length; g++) {
          const leaderIdx = clusterGroups[g][0];
          const sim = wasmInstImages.exports.cosine_similarity(sabIndices[i], sabIndices[leaderIdx], 512);
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
            
            // Find similarity with the group leader instead of O(N^2) comparison with all members
            let maxSim = 0;
            const leaderIdx = group[0];
            if (idx === leaderIdx) {
              maxSim = 1.0;
            } else {
              maxSim = wasmInstImages.exports.cosine_similarity(sabIndices[idx], sabIndices[leaderIdx], 512);
            }

            return {
              ...img,
              maxSimWithGroup: maxSim
            };
          });

          // Sort images inside group by size descending
          groupImages.sort((a, b) => (b.size || 0) - (a.size || 0));

          groups.push({
            images: groupImages
          });
        }
      }

      parentPort.postMessage({ type: 'cluster_result', reqId, success: true, groups });
    } catch (err) {
      console.error("[Search Worker] Cluster error:", err);
      parentPort.postMessage({ type: 'cluster_result', reqId, success: false, error: err.message });
    }
  } else if (msg.type === 'cluster_faces') {
    const { reqId, faceSabIndices, validFaces, threshold = 0.65 } = msg.payload;

    try {
      if (!wasmInstFaces) {
        throw new Error("WASM Face SIMD not mounted");
      }

      const n = validFaces.length;
      const faceGroups = []; // [ [idx0, idx1...], [idx2...] ]

      // DBSCAN / Leader clustering for faces
      for (let i = 0; i < n; i++) {
        let bestGroupIdx = -1;
        let bestSim = -1;

        for (let g = 0; g < faceGroups.length; g++) {
          const leaderIdx = faceGroups[g][0];
          const sim = wasmInstFaces.exports.cosine_similarity(faceSabIndices[i], faceSabIndices[leaderIdx], 512);
          if (sim > bestSim) {
            bestSim = sim;
            bestGroupIdx = g;
          }
        }

        if (bestSim >= threshold) {
          faceGroups[bestGroupIdx].push(i);
        } else {
          faceGroups.push([i]);
        }
      }

      const personClusters = faceGroups.map((group, groupIdx) => {
        const personId = `person_${String(groupIdx + 1).padStart(3, '0')}`;
        const faces = group.map(idx => validFaces[idx]);
        const coverFace = faces[0];
        return {
          id: personId,
          name: `人物 ${groupIdx + 1}`,
          cover_face_id: coverFace ? coverFace.id : null,
          face_count: faces.length,
          faces
        };
      });

      parentPort.postMessage({ type: 'cluster_faces_result', reqId, success: true, personClusters });
    } catch (err) {
      console.error("[Search Worker] Face Cluster error:", err);
      parentPort.postMessage({ type: 'cluster_faces_result', reqId, success: false, error: err.message });
    }
  if (msg.type === 'search_images') {
    const { reqId, validImages } = msg.payload;
    try {
      if (!wasmInstImages) throw new Error("WASM Image SIMD not mounted");
      
      const searchResults = [];
      const queryIdx = 0; // Reserved index 0
      
      for (const target of validImages) {
        if (target.sabIdx !== -1) {
          const score = wasmInstImages.exports.cosine_similarity(queryIdx, target.sabIdx, 512);
          searchResults.push({ path: target.path, score });
        }
      }
      
      searchResults.sort((a, b) => b.score - a.score);
      parentPort.postMessage({ type: 'task_result', reqId, result: { searchResults } });
    } catch (err) {
      parentPort.postMessage({ type: 'task_result', reqId, error: err.message });
    }
    return;
  }
});
