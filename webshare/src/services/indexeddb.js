/**
 * ShareCLIP WebShare IndexedDB Service (webshare-ai)
 * Handles client-side storage for photos, 512-D embeddings, and zero-shot classifications.
 */

const DB_NAME = 'webshare-ai';
const DB_VERSION = 1;

let dbInstance = null;

export async function openDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Photos Store
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('hash', 'hash', { unique: false });
        photoStore.createIndex('receivedAt', 'receivedAt', { unique: false });
      }

      // 2. Embeddings Store (512-D Float32Array vectors)
      if (!db.objectStoreNames.contains('embeddings')) {
        db.createObjectStore('embeddings', { keyPath: 'photoId' });
      }

      // 3. Analysis Results Store (Zero-shot classification results)
      if (!db.objectStoreNames.contains('analysis_results')) {
        db.createObjectStore('analysis_results', { keyPath: 'photoId' });
      }

      // 4. Sessions Store
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Failed to open database:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Compute SHA-256 hash using native Web Crypto API
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>} Hex string
 */
export async function computeSHA256(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Save or update photo metadata
 */
export async function savePhoto(photo) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['photos'], 'readwrite');
    const store = tx.objectStore('photos');
    const req = store.put(photo);
    req.onsuccess = () => resolve(photo);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Find existing photo by SHA-256 hash
 */
export async function getPhotoByHash(hash) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['photos'], 'readonly');
    const store = tx.objectStore('photos');
    const index = store.index('hash');
    const req = index.get(hash);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all photos ordered by receivedAt descending
 */
export async function getAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['photos'], 'readonly');
    const store = tx.objectStore('photos');
    const req = store.getAll();
    req.onsuccess = () => {
      const photos = req.result || [];
      photos.sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0));
      resolve(photos);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save 512-D embedding
 */
export async function saveEmbedding(photoId, vector) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['embeddings'], 'readwrite');
    const store = tx.objectStore('embeddings');
    const req = store.put({
      photoId,
      model: 'MobileCLIP-S0',
      dimension: 512,
      vector: Array.from(vector),
      createdAt: Date.now()
    });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get 512-D embedding by photoId
 */
export async function getEmbedding(photoId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['embeddings'], 'readonly');
    const store = tx.objectStore('embeddings');
    const req = store.get(photoId);
    req.onsuccess = () => resolve(req.result ? new Float32Array(req.result.vector) : null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save zero-shot analysis result
 */
export async function saveAnalysisResult(photoId, categories) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['analysis_results'], 'readwrite');
    const store = tx.objectStore('analysis_results');
    const req = store.put({
      photoId,
      categories,
      analyzedAt: Date.now()
    });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get analysis result by photoId
 */
export async function getAnalysisResult(photoId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['analysis_results'], 'readonly');
    const store = tx.objectStore('analysis_results');
    const req = store.get(photoId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a photo and its associated embeddings and analysis results
 */
export async function deletePhoto(photoId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['photos', 'embeddings', 'analysis_results'], 'readwrite');
    tx.objectStore('photos').delete(photoId);
    tx.objectStore('embeddings').delete(photoId);
    tx.objectStore('analysis_results').delete(photoId);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all analysis results
 */
export async function getAllAnalysisResults() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['analysis_results'], 'readonly');
    const store = tx.objectStore('analysis_results');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all records in IndexedDB
 */
export async function clearDatabase() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['photos', 'embeddings', 'analysis_results', 'sessions'], 'readwrite');
    tx.objectStore('photos').clear();
    tx.objectStore('embeddings').clear();
    tx.objectStore('analysis_results').clear();
    tx.objectStore('sessions').clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
