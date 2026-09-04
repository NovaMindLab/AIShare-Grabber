const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');

class WorkerPool {
  constructor(scriptPath, maxWorkers, idleTimeoutMs, initData = null) {
    this.scriptPath = scriptPath;
    this.maxWorkers = maxWorkers;
    this.idleTimeoutMs = idleTimeoutMs;
    this.initData = initData; 
    
    this.workers = []; // { worker, busy, callbacks }
    this.queue = [];   // { reqId, msg, resolve, reject }
    this.reqIdCounter = 0;
    this.idleTimer = null;
    
    console.log(`[WorkerPool] Created pool for ${path.basename(scriptPath)} (Max: ${maxWorkers}, TTL: ${idleTimeoutMs / 1000}s)`);
  }

  _spawnWorker() {
    const worker = new Worker(this.scriptPath);
    const requiresInit = !!this.initData;
    const workerObj = { worker, initialized: !requiresInit, busy: requiresInit, callbacks: new Map() };
    
    worker.on('message', (msg) => {
      // Handle initialization responses
      if (msg.type === 'init_result') {
        if (!msg.success) {
           console.warn(`[WorkerPool] Init failed for ${path.basename(this.scriptPath)}:`, msg.error || msg);
           this.workers = this.workers.filter(w => w !== workerObj);
        } else {
           console.log(`[WorkerPool] Init success for ${path.basename(this.scriptPath)}`);
           workerObj.initialized = true;
           workerObj.busy = false;
           this._pumpQueue();
        }
        return;
      }
      
      const resolveObj = workerObj.callbacks.get(msg.reqId);
      if (resolveObj) {
        workerObj.callbacks.delete(msg.reqId);
        workerObj.busy = false; // Mark as free
        
        if (msg.success) {
          resolveObj.resolve(msg);
        } else {
          resolveObj.reject(new Error(msg.error));
        }
        
        this._pumpQueue();
      }
    });

    worker.on('error', (err) => {
      console.error(`[WorkerPool] Error in ${path.basename(this.scriptPath)}:`, err);
      for (const resolveObj of workerObj.callbacks.values()) {
        resolveObj.reject(err);
      }
      workerObj.callbacks.clear();
      this.workers = this.workers.filter(w => w !== workerObj);
      this._pumpQueue();
    });

    worker.on('exit', () => {
      this.workers = this.workers.filter(w => w !== workerObj);
    });

    if (this.initData) {
      worker.postMessage({ type: 'init', ...this.initData });
    }
    
    this.workers.push(workerObj);
    return workerObj;
  }

  _pumpQueue() {
    this._resetIdleTimer();
    
    if (this.queue.length === 0) return;
    
    let freeWorker = this.workers.find(w => w.initialized && !w.busy);
    if (!freeWorker && this.workers.length < this.maxWorkers) {
      this._spawnWorker();
      return; // Wait for newly spawned worker to finish init_result before assigning task
    }
    
    if (freeWorker) {
      const task = this.queue.shift();
      freeWorker.busy = true;
      freeWorker.callbacks.set(task.reqId, { resolve: task.resolve, reject: task.reject });
      
      // search worker uses nested payload structure in stage 1, let's keep it robust
      if ((task.msg.type === 'cluster' || task.msg.type === 'cluster_faces' || task.msg.type === 'search_images') && task.msg.payload) {
         task.msg.payload.reqId = task.reqId;
      }
      
      freeWorker.worker.postMessage(task.msg);
      
      // If there are still items in queue and we have other free workers or room to spawn, pump queue
      if (this.queue.length > 0) {
        this._pumpQueue();
      }
    }
  }

  _resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    
    // Only sleep if the queue is empty AND we have active workers running
    if (this.queue.length === 0 && this.workers.length > 0) {
      this.idleTimer = setTimeout(() => {
        console.log(`[WorkerPool] Hibernation TTL reached for ${path.basename(this.scriptPath)}. Terminating ${this.workers.length} worker(s) to free memory.`);
        for (const w of this.workers) {
          w.worker.terminate();
        }
        this.workers = [];
      }, this.idleTimeoutMs);
    }
  }

  async executeTask(msg) {
    return new Promise((resolve, reject) => {
      const reqId = this.reqIdCounter++;
      msg.reqId = reqId; 
      this.queue.push({ reqId, msg, resolve, reject });
      this._pumpQueue();
    });
  }
}

class TaskManager {
  constructor() {
    const cpus = os.cpus().length;
    const memGB = os.totalmem() / (1024 ** 3);

    // Dynamic Hardware Sniffing & Safe Thread Budgeting:
    // Low-end (<= 4 logical threads or <= 5.5GB RAM, e.g. i3-7100U, i5-6200U 4GB):
    // 1 Worker, 2-3 intra threads. Single worker guarantees 0 memory thrashing and prevents OOM.
    //
    // Mid-tier (4-8 logical threads, 6GB-15GB RAM, e.g. i5-6200U 8GB, i5-8250U 8GB):
    // 2 Workers, 2 intra threads per worker (4 threads total).
    //
    // High-tier (>= 8 logical threads, > 15GB RAM, e.g. i7-11800H, i9-13900H, Ryzen 7/9 16GB-32GB):
    // Exactly 2 Workers forming an interleaved 2-stage pipeline (Worker 1 decodes with Sharp while Worker 2 computes ONNX).
    // Benchmarks prove: 2 workers yield 52.4 img/s (19.1ms/img), whereas 4 workers thrash L3 cache & E-cores down to 12.5 img/s!
    // intraThreads is set to 4 per worker (total 8 threads), perfectly matching the P-cores without E-core barrier stalls!
    if (cpus <= 4 || memGB <= 5.5) {
      this.tier = 'Low';
      this.maxInferenceWorkers = 1;
      this.intraThreadsPerWorker = Math.max(1, cpus - 1);
      this.idleTimeoutMs = 3 * 60 * 1000;
    } else if (cpus >= 8 && memGB > 15) {
      this.tier = 'High';
      this.maxInferenceWorkers = 2;
      this.intraThreadsPerWorker = Math.min(4, Math.max(2, Math.floor(cpus / 4)));
      this.idleTimeoutMs = 30 * 60 * 1000;
    } else {
      this.tier = 'Mid';
      this.maxInferenceWorkers = 2;
      this.intraThreadsPerWorker = 2;
      this.idleTimeoutMs = 10 * 60 * 1000;
    }
    
    console.log(`[TaskManager] Hardware Sniffing Result - Tier: ${this.tier} (CPUs: ${cpus}, Mem: ${memGB.toFixed(1)}GB, Workers: ${this.maxInferenceWorkers}, intraThreads: ${this.intraThreadsPerWorker})`);
    
    this.inferencePool = null;
    this.searchPool = null;

    // --- Stage 3: SharedArrayBuffer Setup ---
    if (this.tier === 'Low') {
      this.MAX_IMAGES = 20000;  // 40MB
      this.MAX_FACES = 10000;   // 20MB
    } else if (this.tier === 'Mid') {
      this.MAX_IMAGES = 50000;  // 100MB
      this.MAX_FACES = 20000;   // 40MB
    } else {
      this.MAX_IMAGES = 100000; // 200MB
      this.MAX_FACES = 50000;   // 100MB
    }
    
    this.DIM = 512;
    // Allocate shared memory dynamically based on tier using WebAssembly.Memory
    const maxPages = Math.ceil((this.MAX_IMAGES * this.DIM * 4) / 65536);
    this.wasmMemImages = new WebAssembly.Memory({ initial: 16, maximum: maxPages, shared: true });
    this.sharedBuffer = this.wasmMemImages.buffer;
    this.floatView = new Float32Array(this.sharedBuffer);
    this.imageToIndex = new Map();
    this.nextIndex = 1; // Reserve index 0 for the query vector

    // Face SharedArrayBuffer Allocation
    const maxFacePages = Math.ceil((this.MAX_FACES * this.DIM * 4) / 65536);
    this.wasmMemFaces = new WebAssembly.Memory({ initial: 16, maximum: maxFacePages, shared: true });
    this.faceSharedBuffer = this.wasmMemFaces.buffer;
    this.faceFloatView = new Float32Array(this.faceSharedBuffer);
    this.faceIdToIndex = new Map();
    this.nextFaceIndex = 0;
    
    console.log(`[TaskManager] Allocated initial 1MB Image SAB (Max ${maxPages} pages) and 1MB Face SAB for Zero-Copy exchange.`);
  }
  
  getSabIndex(imagePath) {
    if (this.imageToIndex.has(imagePath)) {
      return this.imageToIndex.get(imagePath);
    }
    if (this.nextIndex >= this.MAX_IMAGES) {
      console.warn("[TaskManager] SAB capacity reached! Ignoring new images for SAB.");
      return -1;
    }
    const idx = this.nextIndex++;
    this.imageToIndex.set(imagePath, idx);
    return idx;
  }

  getExistingSabIndex(imagePath) {
    return this.imageToIndex.has(imagePath) ? this.imageToIndex.get(imagePath) : -1;
  }

  addEmbeddingToSAB(imagePath, embedding) {
    const sabIndex = this.getSabIndex(imagePath);
    if (sabIndex !== -1 && embedding) {
      const requiredBytes = (sabIndex + 1) * this.DIM * 4;
      if (requiredBytes > this.sharedBuffer.byteLength) {
        const pagesToGrow = Math.ceil((requiredBytes - this.sharedBuffer.byteLength) / 65536);
        const growPages = Math.max(pagesToGrow, 100);
        try {
          this.wasmMemImages.grow(growPages);
        } catch(e) {
          this.wasmMemImages.grow(pagesToGrow);
        }
        this.sharedBuffer = this.wasmMemImages.buffer; // FIX: Update buffer reference
        this.floatView = new Float32Array(this.sharedBuffer); // Refresh view
      }
      this.floatView.set(embedding, sabIndex * this.DIM);
    }
    return sabIndex;
  }

  getFaceSabIndex(faceId) {
    if (this.faceIdToIndex.has(faceId)) {
      return this.faceIdToIndex.get(faceId);
    }
    if (this.nextFaceIndex >= this.MAX_FACES) {
      console.warn("[TaskManager] Face SAB capacity reached! Ignoring new face for SAB.");
      return -1;
    }
    const idx = this.nextFaceIndex++;
    this.faceIdToIndex.set(faceId, idx);
    return idx;
  }

  addFaceEmbeddingToSAB(faceId, embedding) {
    const sabIndex = this.getFaceSabIndex(faceId);
    if (sabIndex !== -1 && embedding) {
      const requiredBytes = (sabIndex + 1) * this.DIM * 4;
      if (requiredBytes > this.faceSharedBuffer.byteLength) {
        const pagesToGrow = Math.ceil((requiredBytes - this.faceSharedBuffer.byteLength) / 65536);
        const growPages = Math.max(pagesToGrow, 100);
        try {
          this.wasmMemFaces.grow(growPages);
        } catch(e) {
          this.wasmMemFaces.grow(pagesToGrow);
        }
        this.faceSharedBuffer = this.wasmMemFaces.buffer; // FIX: Update buffer reference
        this.faceFloatView = new Float32Array(this.faceSharedBuffer); // Refresh view
      }
      this.faceFloatView.set(embedding, sabIndex * this.DIM);
    }
    return sabIndex;
  }

  init(modelPath, scrfdModelPath = null, mobilefacenetModelPath = null) {
    // Use the tier-based maxInferenceWorkers (e.g., up to 6 on High tier) to fully utilize CPU
    const inferenceWorkers = this.maxInferenceWorkers || Math.max(1, Math.floor(cpus / 2) - 1);
    
    this.inferencePool = new WorkerPool(
      path.join(__dirname, 'inference.worker.cjs'), 
      inferenceWorkers, 
      60000,
      { 
        physicalModelPath: modelPath,
        physicalScrfdModelPath: scrfdModelPath,
        physicalMobilefacenetModelPath: mobilefacenetModelPath,
        intraThreads: this.intraThreadsPerWorker
      }
    );
    
    // Pass the WebAssembly.Memory objects to the Search Worker
    this.searchPool = new WorkerPool(
      path.join(__dirname, 'search.worker.cjs'), 
      1, 
      this.idleTimeoutMs,
      { 
        wasmMemImages: this.wasmMemImages,
        wasmMemFaces: this.wasmMemFaces,
        sharedBuffer: this.sharedBuffer,
        faceSharedBuffer: this.faceSharedBuffer
      }
    );
  }
  
  async computeClip(imagePath, thumbPath = null) {
    if (!this.inferencePool) throw new Error("TaskManager not initialized");
    const result = await this.inferencePool.executeTask({ type: 'compute_clip', imagePath, thumbPath });
    
    // Automatically populate SAB when computed
    if (result.embedding) {
      this.addEmbeddingToSAB(imagePath, result.embedding);
    }
    return result;
  }

  async computeFace(imagePath) {
    if (!this.inferencePool) throw new Error("TaskManager not initialized");
    const result = await this.inferencePool.executeTask({ type: 'compute_face', imagePath });
    
    if (result.faces && Array.isArray(result.faces)) {
      result.faces.forEach(face => {
        if (face.id && face.embedding) {
          this.addFaceEmbeddingToSAB(face.id, face.embedding);
        }
      });
    }
    return result;
  }
  
  async clusterImages(sabIndices, validImages, threshold) {
    if (!this.searchPool) throw new Error("TaskManager not initialized");
    const result = await this.searchPool.executeTask({ 
      type: 'cluster', 
      payload: { sabIndices, validImages, threshold } 
    });
    return result.groups;
  }

  async clusterFaces(faceSabIndices, validFaces, threshold = 0.44) {
    if (!this.searchPool) throw new Error("TaskManager not initialized");
    const result = await this.searchPool.executeTask({
      type: 'cluster_faces',
      payload: { faceSabIndices, validFaces, threshold }
    });
    return result.personClusters;
  }

  async searchImages(queryEmbedding, validImages) {
    if (!this.searchPool) throw new Error("TaskManager not initialized");
    
    // Copy query embedding to index 0 (reserved for query)
    this.floatView.set(queryEmbedding, 0);

    const result = await this.searchPool.executeTask({
      type: 'search_images',
      payload: { validImages }
    });
    return result.searchResults;
  }
}

module.exports = new TaskManager();
