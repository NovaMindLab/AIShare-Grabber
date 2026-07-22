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
    const workerObj = { worker, busy: false, callbacks: new Map() };
    
    worker.on('message', (msg) => {
      // Handle initialization responses
      if (msg.type === 'init_result') {
        if (!msg.success) {
           console.warn(`[WorkerPool] Init failed for ${path.basename(this.scriptPath)}:`, msg.error || msg);
        } else {
           console.log(`[WorkerPool] Init success for ${path.basename(this.scriptPath)}`);
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
    
    let freeWorker = this.workers.find(w => !w.busy);
    if (!freeWorker && this.workers.length < this.maxWorkers) {
      freeWorker = this._spawnWorker();
    }
    
    if (freeWorker) {
      const task = this.queue.shift();
      freeWorker.busy = true;
      freeWorker.callbacks.set(task.reqId, { resolve: task.resolve, reject: task.reject });
      
      // search worker uses nested payload structure in stage 1, let's keep it robust
      if (task.msg.type === 'cluster' && task.msg.payload) {
         task.msg.payload.reqId = task.reqId;
      }
      
      freeWorker.worker.postMessage(task.msg);
      
      // If there are still items in queue and we haven't reached maxWorkers, spawn another
      if (this.queue.length > 0 && this.workers.length < this.maxWorkers) {
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

    this.tier = 'Mid';
    this.maxInferenceWorkers = 2;
    this.idleTimeoutMs = 10 * 60 * 1000;

    if (cpus <= 4 || memGB <= 8) {
      this.tier = 'Low';
      this.maxInferenceWorkers = 1;
      this.idleTimeoutMs = 3 * 60 * 1000;
    } else if (cpus >= 8 && memGB > 16) {
      this.tier = 'High';
      this.maxInferenceWorkers = Math.min(6, Math.max(4, cpus - 2));
      this.idleTimeoutMs = 30 * 60 * 1000;
    }
    
    console.log(`[TaskManager] Hardware Sniffing Result - Tier: ${this.tier} (CPUs: ${cpus}, Mem: ${memGB.toFixed(1)}GB)`);
    
    this.inferencePool = null;
    this.searchPool = null;

    // --- Stage 3: SharedArrayBuffer Setup ---
    if (this.tier === 'Low') {
      this.MAX_IMAGES = 20000;  // 40MB
    } else if (this.tier === 'Mid') {
      this.MAX_IMAGES = 50000;  // 100MB
    } else {
      this.MAX_IMAGES = 100000; // 200MB
    }
    
    this.DIM = 512;
    // Allocate shared memory dynamically based on tier
    this.sharedBuffer = new SharedArrayBuffer(this.MAX_IMAGES * this.DIM * 4);
    this.floatView = new Float32Array(this.sharedBuffer);
    this.imageToIndex = new Map();
    this.nextIndex = 0;
    
    const allocMB = (this.MAX_IMAGES * this.DIM * 4) / (1024 * 1024);
    console.log(`[TaskManager] Allocated ${allocMB}MB SharedArrayBuffer (Capacity: ${this.MAX_IMAGES} images) for Zero-Copy exchange.`);
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

  addEmbeddingToSAB(imagePath, embedding) {
    const sabIndex = this.getSabIndex(imagePath);
    if (sabIndex !== -1) {
      this.floatView.set(embedding, sabIndex * this.DIM);
    }
    return sabIndex;
  }

  init(modelPath) {
    const cpus = os.cpus().length;
    // Cap inference workers to max 2 to maximize cache efficiency, prevent thread thrashing and preserve CPU cores for WebRTC & UI
    const inferenceWorkers = Math.min(2, Math.max(1, Math.floor(cpus / 4)));
    
    this.inferencePool = new WorkerPool(
      path.join(__dirname, 'inference.worker.cjs'), 
      inferenceWorkers, 
      60000,
      { physicalModelPath: modelPath }
    );
    
    // Pass the sharedBuffer to the Search Worker
    this.searchPool = new WorkerPool(
      path.join(__dirname, 'search.worker.cjs'), 
      1, 
      this.idleTimeoutMs,
      { sharedBuffer: this.sharedBuffer }
    );
  }
  
  async computeEmbedding(imagePath) {
    if (!this.inferencePool) throw new Error("TaskManager not initialized");
    const result = await this.inferencePool.executeTask({ type: 'compute', imagePath });
    
    // Automatically populate SAB when computed
    if (result.embedding) {
      this.addEmbeddingToSAB(imagePath, result.embedding);
    }
    return result.embedding;
  }
  
  async clusterImages(sabIndices, validImages, threshold) {
    if (!this.searchPool) throw new Error("TaskManager not initialized");
    const result = await this.searchPool.executeTask({ 
      type: 'cluster', 
      payload: { sabIndices, validImages, threshold } 
    });
    return result.groups;
  }
}

module.exports = new TaskManager();
