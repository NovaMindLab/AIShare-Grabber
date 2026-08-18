const taskManager = require('./src/workers/task-manager.cjs');
const path = require('path');
const fs = require('fs');

async function runBenchmark() {
  const modelPath = path.join(__dirname, 'mobileclip2_s0_image_encoder.onnx');
  const scrfdPath = path.join(__dirname, 'det_500m.onnx');
  const mobilefacenetPath = path.join(__dirname, 'w600k_mbf.onnx');

  taskManager.init(
    fs.existsSync(modelPath) ? modelPath : null,
    fs.existsSync(scrfdPath) ? scrfdPath : null,
    fs.existsSync(mobilefacenetPath) ? mobilefacenetPath : null
  );

  // Wait a bit for models to load in worker threads
  await new Promise(resolve => setTimeout(resolve, 2000));

  const imagePath = path.join(__dirname, '../logo.png'); // assuming this exists
  if (!fs.existsSync(imagePath)) {
    console.error("Test image not found:", imagePath);
    process.exit(1);
  }

  console.log("Warming up (first run is usually slower)...");
  try {
    await taskManager.computeEmbedding(imagePath);
  } catch (e) {
    console.log("Warmup error (maybe no faces in logo?):", e.message);
  }

  const numTests = 3;
  console.log(`\nRunning ${numTests} iterations to measure average speed...`);
  
  let totalTime = 0;
  for (let i = 0; i < numTests; i++) {
    const start = performance.now();
    const result = await taskManager.computeEmbedding(imagePath);
    const end = performance.now();
    
    const duration = end - start;
    totalTime += duration;
    console.log(`Iteration ${i + 1}: ${duration.toFixed(2)} ms (Detected faces: ${result.faces ? result.faces.length : 0})`);
    if (result.timings) {
      console.log(`  ├─ Sharp CLIP Prep: ${result.timings.sharpClipPrep.toFixed(2)} ms`);
      console.log(`  ├─ MobileCLIP Run: ${result.timings.clipTime.toFixed(2)} ms`);
      console.log(`  ├─ Sharp SCRFD Prep: ${result.timings.sharpScrfdPrep.toFixed(2)} ms`);
      console.log(`  ├─ SCRFD Run: ${result.timings.scrfdTime.toFixed(2)} ms`);
      console.log(`  ├─ SCRFD Parse/NMS: ${result.timings.scrfdNmsTime.toFixed(2)} ms`);
      if (result.timings.faceNetTime !== undefined) {
         console.log(`  ├─ Sharp FaceNet Prep: ${result.timings.sharpFaceNetPrep.toFixed(2)} ms`);
         console.log(`  └─ FaceNet Run: ${result.timings.faceNetTime.toFixed(2)} ms`);
      }
    }
  }

  console.log(`\nAverage processing time per image: ${(totalTime / numTests).toFixed(2)} ms`);
  process.exit(0);
}

runBenchmark().catch(err => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
