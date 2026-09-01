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
    const { reqId, faceSabIndices, validFaces, threshold = 0.44 } = msg.payload;

    try {
      if (!wasmInstFaces) {
        throw new Error("WASM Face SIMD not mounted");
      }

      const n = validFaces ? validFaces.length : 0;
      if (n === 0) {
        parentPort.postMessage({ type: 'cluster_faces_result', reqId, success: true, personClusters: [] });
        return;
      }

      // Stage 1 threshold (default 0.44 for MobileFaceNet 512-d embeddings)
      const stage1Threshold = (typeof threshold === 'number' && threshold > 0) ? threshold : 0.44;
      // Stage 2 merge threshold (default 0.43)
      const stage2Threshold = Math.min(stage1Threshold, 0.43);

      const memBuffer = wasmMemFacesRef ? wasmMemFacesRef.buffer : (wasmInstFaces.exports.memory ? wasmInstFaces.exports.memory.buffer : null);
      const faceFloatView = memBuffer ? new Float32Array(memBuffer) : null;

      function getCentroid(group) {
        if (!faceFloatView || !group || group.length === 0) return null;
        const c = new Float32Array(512);
        for (const idx of group) {
          const offset = faceSabIndices[idx] * 512;
          for (let d = 0; d < 512; d++) {
            c[d] += faceFloatView[offset + d];
          }
        }
        let norm = 0;
        for (let d = 0; d < 512; d++) {
          norm += c[d] * c[d];
        }
        norm = Math.sqrt(norm);
        if (norm > 1e-6) {
          for (let d = 0; d < 512; d++) {
            c[d] /= norm;
          }
        }
        return c;
      }

      function simFaceToCentroid(faceIdx, centroid) {
        if (!faceFloatView || !centroid) return -1;
        const offset = faceSabIndices[faceIdx] * 512;
        let sum = 0;
        for (let d = 0; d < 512; d++) {
          sum += faceFloatView[offset + d] * centroid[d];
        }
        return sum;
      }

      function simCentroidToCentroid(c1, c2) {
        if (!c1 || !c2) return -1;
        let sum = 0;
        for (let d = 0; d < 512; d++) {
          sum += c1[d] * c2[d];
        }
        return sum;
      }

      const faceGroups = []; // Array of index arrays: [ [idx0, idx1...], [idx2...] ]
      const groupCentroids = []; // Array of Float32Array(512)

      // --- Stage 1: Adaptive Graph / Average-Linkage with Centroid & Top-K Representation ---
      for (let i = 0; i < n; i++) {
        let bestGroupIdx = -1;
        let bestScore = -1;
        const curPath = validFaces[i] && validFaces[i].path;

        for (let g = 0; g < faceGroups.length; g++) {
          // Same-photo exclusion: Two faces in the same photo cannot belong to the same person
          let hasSamePhotoConflict = false;
          if (curPath) {
            for (const memberIdx of faceGroups[g]) {
              if (validFaces[memberIdx] && validFaces[memberIdx].path === curPath) {
                hasSamePhotoConflict = true;
                break;
              }
            }
          }
          if (hasSamePhotoConflict) {
            continue; // Skip this group
          }

          // 1. Centroid similarity
          const centroidSim = simFaceToCentroid(i, groupCentroids[g]);

          // 2. Top-k representative similarity
          const memberSims = [];
          for (const memberIdx of faceGroups[g]) {
            const sim = wasmInstFaces.exports.cosine_similarity(faceSabIndices[i], faceSabIndices[memberIdx], 512);
            memberSims.push(sim);
          }
          memberSims.sort((a, b) => b - a);
          const k = Math.min(3, memberSims.length);
          let topKSum = 0;
          for (let m = 0; m < k; m++) {
            topKSum += memberSims[m];
          }
          const topKAvgSim = topKSum / k;

          const maxMemberSim = memberSims.length > 0 ? memberSims[0] : -1;

          // Adaptive Score: best of centroid representation, top-k linkage, or nearest-neighbor match
          const score = Math.max(centroidSim, topKAvgSim, maxMemberSim);

          if (score >= stage1Threshold && score > bestScore) {
            bestScore = score;
            bestGroupIdx = g;
          }
        }

        if (bestGroupIdx !== -1) {
          faceGroups[bestGroupIdx].push(i);
          groupCentroids[bestGroupIdx] = getCentroid(faceGroups[bestGroupIdx]);
        } else {
          faceGroups.push([i]);
          groupCentroids.push(getCentroid([i]));
        }
      }

      // --- Stage 2: Agglomerative Centroid / Pairwise Cluster Merge ---
      function hasPhotoConflict(groupA, groupB) {
        const pathsA = new Set();
        for (const idx of groupA) {
          const p = validFaces[idx] && validFaces[idx].path;
          if (p) pathsA.add(p);
        }
        for (const idx of groupB) {
          const p = validFaces[idx] && validFaces[idx].path;
          if (p && pathsA.has(p)) return true;
        }
        return false;
      }

      function computeInterClusterSim(groupA, groupB) {
        const sims = [];
        let maxPairSim = -1;
        for (const idxA of groupA) {
          for (const idxB of groupB) {
            const sim = wasmInstFaces.exports.cosine_similarity(faceSabIndices[idxA], faceSabIndices[idxB], 512);
            sims.push(sim);
            if (sim > maxPairSim) maxPairSim = sim;
          }
        }
        sims.sort((a, b) => b - a);
        const k = Math.min(3, sims.length);
        let sum = 0;
        for (let m = 0; m < k; m++) {
          sum += sims[m];
        }
        const topKAvg = sum / k;
        return { topKAvg, maxPairSim };
      }

      // Iteratively merge closest cluster pairs until no pairs >= stage2Threshold exist
      while (faceGroups.length > 1) {
        let bestSim = -1;
        let bestG1 = -1;
        let bestG2 = -1;

        for (let g1 = 0; g1 < faceGroups.length; g1++) {
          for (let g2 = g1 + 1; g2 < faceGroups.length; g2++) {
            if (hasPhotoConflict(faceGroups[g1], faceGroups[g2])) {
              continue;
            }

            // 1. Centroid similarity between clusters
            const centroidSim = simCentroidToCentroid(groupCentroids[g1], groupCentroids[g2]);

            // 2. Inter-cluster pairwise similarity
            const { topKAvg, maxPairSim } = computeInterClusterSim(faceGroups[g1], faceGroups[g2]);

            const interSim = Math.max(centroidSim, topKAvg, maxPairSim);

            if (interSim > bestSim) {
              bestSim = interSim;
              bestG1 = g1;
              bestG2 = g2;
            }
          }
        }

        if (bestG1 !== -1 && bestG2 !== -1 && bestSim >= stage2Threshold) {
          faceGroups[bestG1].push(...faceGroups[bestG2]);
          groupCentroids[bestG1] = getCentroid(faceGroups[bestG1]);
          faceGroups.splice(bestG2, 1);
          groupCentroids.splice(bestG2, 1);
        } else {
          break; // No further clusters can be merged
        }
      }

      // --- Stage 3: Cover Selection, Sorting and Formatting ---
      let personClusters = faceGroups.map((group, groupIdx) => {
        const faces = group.map(idx => validFaces[idx]);
        
        // Select face with the largest bounding box area as the best cover face portrait
        let coverFace = faces[0];
        let maxArea = -1;
        for (const f of faces) {
          if (f) {
            let area = 0;
            if (f.bbox) {
              try {
                const bbox = typeof f.bbox === 'string' ? JSON.parse(f.bbox) : f.bbox;
                if (Array.isArray(bbox) && bbox.length >= 4) {
                  const w = Math.abs(bbox[2]);
                  const h = Math.abs(bbox[3]);
                  area = w * h;
                }
              } catch (_) {}
            }
            if (area > maxArea) {
              maxArea = area;
              coverFace = f;
            }
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
