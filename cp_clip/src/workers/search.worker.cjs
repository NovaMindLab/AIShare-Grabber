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
    const { reqId, faceSabIndices, validFaces, threshold = 0.50 } = msg.payload;

    try {
      if (!wasmInstFaces) {
        throw new Error("WASM Face SIMD not mounted");
      }

      const n = validFaces.length;
      const faceGroups = []; // [ [idx0, idx1...], [idx2...] ]

      // Strict Average-Linkage with Same-Photo Exclusion and Min-Similarity Bound
      for (let i = 0; i < n; i++) {
        let bestGroupIdx = -1;
        let bestAvgSim = -1;
        const curPath = validFaces[i].path;

        for (let g = 0; g < faceGroups.length; g++) {
          // 1. Same-Photo Exclusion Rule: 2 faces in the same photo cannot belong to the same person!
          let hasSamePhotoConflict = false;
          for (const memberIdx of faceGroups[g]) {
            if (validFaces[memberIdx].path === curPath) {
              hasSamePhotoConflict = true;
              break;
            }
          }
          if (hasSamePhotoConflict) {
            continue; // Skip this group
          }

          let totalSim = 0;
          let minSim = 1.0;
          for (const memberIdx of faceGroups[g]) {
            const sim = wasmInstFaces.exports.cosine_similarity(faceSabIndices[i], faceSabIndices[memberIdx], 512);
            totalSim += sim;
            if (sim < minSim) minSim = sim;
          }
          const avgSim = totalSim / faceGroups[g].length;

          // ArcFace MobileFaceNet optimal threshold (avgSim >= threshold ~0.50, minSim >= 0.42)
          if (avgSim >= threshold && minSim >= 0.42 && avgSim > bestAvgSim) {
            bestAvgSim = avgSim;
            bestGroupIdx = g;
          }
        }

        if (bestGroupIdx !== -1) {
          faceGroups[bestGroupIdx].push(i);
        } else {
          faceGroups.push([i]);
        }
      }

      // Map to person clusters and select the highest quality / largest face as cover
      let personClusters = faceGroups.map((group, groupIdx) => {
        const personId = `person_${String(groupIdx + 1).padStart(3, '0')}`;
        const faces = group.map(idx => validFaces[idx]);
        
        // Select face with the largest bounding box area as the best cover face portrait
        let coverFace = faces[0];
        let maxArea = -1;
        for (const f of faces) {
          if (f && f.bbox) {
            try {
              const bbox = typeof f.bbox === 'string' ? JSON.parse(f.bbox) : f.bbox;
              if (Array.isArray(bbox) && bbox.length === 4) {
                const area = (bbox[2] || 0) * (bbox[3] || 0);
                if (area > maxArea) {
                  maxArea = area;
                  coverFace = f;
                }
              }
            } catch (_) {}
          }
        }

        return {
          id: personId,
          name: `人物 ${groupIdx + 1}`,
          cover_face_id: coverFace ? coverFace.id : null,
          face_count: faces.length,
          faces
        };
      });

      // Sort clusters by face_count descending (most frequent people at the top)
      personClusters.sort((a, b) => b.face_count - a.face_count);
      // Re-index names to match the sorted order
      personClusters.forEach((c, idx) => {
        c.name = `人物 ${idx + 1}`;
      });

      parentPort.postMessage({ type: 'cluster_faces_result', reqId, success: true, personClusters });
    } catch (err) {
      console.error("[Search Worker] Face Cluster error:", err);
      parentPort.postMessage({ type: 'cluster_faces_result', reqId, success: false, error: err.message });
    }
  } // <-- Added missing closing bracket for the cluster_faces block
  
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
      // Use same protocol as cluster/cluster_faces: success flag at top level
      parentPort.postMessage({ reqId, success: true, searchResults });
    } catch (err) {
      console.error('[Search Worker] search_images error:', err);
      parentPort.postMessage({ reqId, success: false, error: err.message });
    }
    return;
  }
});
