const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  const mem = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
  console.log("Main thread created memory:", mem);
  const worker = new Worker(__filename);
  worker.postMessage({ memory: mem });
  worker.on('message', msg => console.log("Worker says:", msg));
} else {
  parentPort.on('message', msg => {
    console.log("Worker received:", msg.memory);
    parentPort.postMessage("Memory received and looks good!");
  });
}
