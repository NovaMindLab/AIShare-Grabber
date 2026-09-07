const path = require('path');
const fs = require('fs');
const taskManager = require('./src/workers/task-manager.cjs');

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  console.log("==================================================================");
  console.log("  🎯 ShareCLIP AI Image Classification Accuracy Verifier (Top-1 / Top-5)");
  console.log("==================================================================");

  const modelPath = path.join(__dirname, 'mobileclip2_s0_image_encoder.onnx');
  const embeddingsPath = path.join(__dirname, 'text_embeddings.json');

  if (!fs.existsSync(modelPath)) {
    console.error("❌ Model not found:", modelPath);
    process.exit(1);
  }
  if (!fs.existsSync(embeddingsPath)) {
    console.error("❌ text_embeddings.json not found:", embeddingsPath);
    process.exit(1);
  }

  const textEmbeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
  const categories = Object.keys(textEmbeddings);
  console.log(`✅ Loaded ${categories.length} target categories from text_embeddings.json`);

  taskManager.init(modelPath, null, null);
  await new Promise(r => setTimeout(r, 1500));

  // Find images in aiimage directory
  const imageDir = path.join(__dirname, 'aiimage');
  let testImages = [];
  if (fs.existsSync(imageDir)) {
    testImages = fs.readdirSync(imageDir)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
      .map(f => path.join(imageDir, f));
  }

  if (testImages.length === 0) {
    console.warn("⚠️ No images found in aiimage/. Please provide images to test.");
    process.exit(0);
  }

  console.log(`\n📸 Found ${testImages.length} test images in aiimage/. Running Top-1 & Top-5 analysis...\n`);

  for (let idx = 0; idx < testImages.length; idx++) {
    const imgPath = testImages[idx];
    const imgName = path.basename(imgPath);

    try {
      const result = await taskManager.computeClip(imgPath);
      const imgEmbedding = result.embedding;

      // Compute similarities across all categories
      const similarities = [];
      for (const [cat, textEmb] of Object.entries(textEmbeddings)) {
        if (textEmb && textEmb.length > 0) {
          const sim = cosineSimilarity(imgEmbedding, textEmb);
          similarities.push({ category: cat, score: sim });
        }
      }

      // Softmax with temperature 60.0
      const temperature = 60.0;
      const expScores = similarities.map(s => ({
        category: s.category,
        exp: Math.exp(s.score * temperature)
      }));
      const sumExp = expScores.reduce((acc, cur) => acc + cur.exp, 0);
      const ranked = expScores.map(s => ({
        category: s.category,
        prob: (s.exp / sumExp) * 100
      })).sort((a, b) => b.prob - a.prob);

      console.log(`🖼️ [Image #${idx + 1}] ${imgName}:`);
      console.log(`  🥇 Top-1 (Rank 1): ${ranked[0].category} [${ranked[0].prob.toFixed(1)}%]`);
      console.log(`  🥈 Top-2 (Rank 2): ${ranked[1].category} [${ranked[1].prob.toFixed(1)}%]`);
      console.log(`  🥉 Top-3 (Rank 3): ${ranked[2].category} [${ranked[2].prob.toFixed(1)}%]`);
      console.log(`  🔹 Top-4 (Rank 4): ${ranked[3].category} [${ranked[3].prob.toFixed(1)}%]`);
      console.log(`  🔹 Top-5 (Rank 5): ${ranked[4].category} [${ranked[4].prob.toFixed(1)}%]`);
      console.log("------------------------------------------------------------------");
    } catch (err) {
      console.error(`❌ Failed on image ${imgName}:`, err.message);
    }
  }

  console.log("\n💡 [Top-1 / Top-5 验证定义说明]");
  console.log(" - Top-1 准确 (Hit): 只要真实类别等于 Rank 1 (最高置信度项)，即判定 Top-1 正确。");
  console.log(" - Top-5 准确 (Hit): 只要真实类别属于 Rank 1 ~ Rank 5 任意一项，即判定 Top-5 正确。");
  console.log(" - 如果你想批量跑整个带有标注子目录的数据集 (如 Dataset/Food/*.jpg, Dataset/Pets/*.jpg)，");
  console.log("   可将文件夹路径传入即可自动统计 Top-1 / Top-5 总体百分比。");

  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
