const { parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');

let wasmInstImages = null;
let wasmInstFaces = null;
let wasmMemFacesRef = null;

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
        wasmMemFacesRef = msg.wasmMemFaces;
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
    const { reqId, faceSabIndices, validFaces, threshold = 0.55 } = msg.payload;

    try {
      if (!wasmInstFaces) {
        throw new Error("WASM Face SIMD not mounted");
      }

      const n = validFaces ? validFaces.length : 0;
      if (n === 0) {
        parentPort.postMessage({ type: 'cluster_faces_result', reqId, success: true, personClusters: [] });
        return;
      }

      // Average Linkage threshold for MobileFaceNet 512-d normalized face embeddings (default: 0.55)
      const mergeThreshold = (typeof threshold === 'number' && threshold > 0) ? threshold : 0.55;

      const memBuffer = wasmMemFacesRef ? wasmMemFacesRef.buffer : (wasmInstFaces.exports.memory ? wasmInstFaces.exports.memory.buffer : null);
      const faceFloatView = memBuffer ? new Float32Array(memBuffer) : null;
      if (!faceFloatView) {
        throw new Error("Face float view buffer unavailable");
      }

      // Fast 512-dimension vector dot product
      function dot512(v1, v2) {
        let sum = 0;
        for (let d = 0; d < 512; d++) {
          sum += v1[d] * v2[d];
        }
        return sum;
      }

      // Initialize each face as its own singleton cluster
      // Each cluster holds:
      // - members: array of face indices [0..n-1]
      // - sumVec: Float32Array(512), sum of all member embeddings in the cluster
      // - paths: Set of photo paths (for strict Same-Photo Exclusion)
      const clusters = [];
      for (let i = 0; i < n; i++) {
        const offset = faceSabIndices[i] * 512;
        const sumVec = new Float32Array(512);
        for (let d = 0; d < 512; d++) {
          sumVec[d] = faceFloatView[offset + d];
        }
        const paths = new Set();
        if (validFaces[i] && validFaces[i].path) {
          paths.add(validFaces[i].path);
        }
        clusters.push({
          members: [i],
          sumVec,
          paths
        });
      }

      // Agglomerative Hierarchical Clustering (HAC) with Average Linkage (UPGMA)
      // Mathematical property in cosine space:
      // average_similarity(cA, cB) = (cA.sumVec . cB.sumVec) / (|cA| * |cB|)
      // This is mathematically immune to single-linkage chaining (which previously caused 68 unrelated
      // photos to be merged into one giant cluster), while computing in O(512) per cluster pair.
      while (clusters.length > 1) {
        let bestAvgSim = -1;
        let bestI = -1;
        let bestJ = -1;

        for (let i = 0; i < clusters.length; i++) {
          const cA = clusters[i];
          const countA = cA.members.length;

          for (let j = i + 1; j < clusters.length; j++) {
            const cB = clusters[j];

            // Hard constraint: Same-Photo Exclusion
            // Two faces detected in the same photograph can NEVER belong to the same person.
            let conflict = false;
            for (const p of cB.paths) {
              if (cA.paths.has(p)) {
                conflict = true;
                break;
              }
            }
            if (conflict) continue;

            const avgSim = dot512(cA.sumVec, cB.sumVec) / (countA * cB.members.length);
            if (avgSim > bestAvgSim) {
              bestAvgSim = avgSim;
              bestI = i;
              bestJ = j;
            }
          }
        }

        if (bestI !== -1 && bestJ !== -1 && bestAvgSim >= mergeThreshold) {
          const cA = clusters[bestI];
          const cB = clusters[bestJ];
          cA.members.push(...cB.members);
          for (let d = 0; d < 512; d++) {
            cA.sumVec[d] += cB.sumVec[d];
          }
          for (const p of cB.paths) {
            cA.paths.add(p);
          }
          clusters.splice(bestJ, 1);
        } else {
          break; // No more pairs meet the threshold
        }
      }

      // --- Cover Selection, Sorting and Formatting ---
      let personClusters = clusters.map((c, groupIdx) => {
        const faces = c.members.map(idx => validFaces[idx]);

        // Select face with the largest bounding box area as the best cover face portrait
        let coverFace = faces[0];
        let maxArea = -1;
        for (const f of faces) {
          if (f && f.bbox) {
            try {
              const bbox = typeof f.bbox === 'string' ? JSON.parse(f.bbox) : f.bbox;
              if (Array.isArray(bbox) && bbox.length >= 4) {
                const area = Math.abs(bbox[2]) * Math.abs(bbox[3]);
                if (area > maxArea) {
                  maxArea = area;
                  coverFace = f;
                }
              }
            } catch (_) {}
          }
        }

        return {
          id: `person_${String(groupIdx + 1).padStart(3, '0')}`,
          name: `人物 ${groupIdx + 1}`,
          cover_face_id: coverFace ? coverFace.id : null,
          face_count: faces.length,
          faces
        };
      });

      // Sort clusters by face_count descending (most frequent people at the top)
      personClusters.sort((a, b) => b.face_count - a.face_count);
      // Re-index IDs and names to match the sorted order
      personClusters.forEach((c, idx) => {
        c.id = `person_${String(idx + 1).padStart(3, '0')}`;
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
