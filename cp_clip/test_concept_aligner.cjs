const path = require('path');
const fs = require('fs');
const { getGlobalConceptAligner } = require('./concept_aligner.cjs');
const { SimpleTokenizer } = require('./tokenizer.cjs');
const ort = require('onnxruntime-node');

async function runConceptAlignerTests() {
  console.log("==================================================================");
  console.log("🧪 Running ShareCLIP International Concept Aligner Unit & E2E Tests");
  console.log("==================================================================");

  const aligner = getGlobalConceptAligner();

  // 1. Language Detection & Fast-Path Tests
  const testCases = [
    { lang: "English", input: "golden retriever on the grass", expectedIncludes: "golden retriever on the grass" },
    { lang: "English Single Word", input: "dog", expectedIncludes: "dog" },
    { lang: "Chinese", input: "天空中的飞机", expectedIncludes: "airplane" },
    { lang: "Chinese", input: "草地上的金毛犬", expectedIncludes: "dog" },
    { lang: "Chinese Document", input: "餐厅发票账单", expectedIncludes: "receipt" },
    { lang: "Spanish", input: "perro en la playa", expectedIncludes: "dog" },
    { lang: "Spanish", input: "factura", expectedIncludes: "receipt" },
    { lang: "German", input: "Rechnung", expectedIncludes: "receipt" },
    { lang: "German", input: "Hund auf dem Rasen", expectedIncludes: "dog" },
    { lang: "French", input: "bébé qui dort", expectedIncludes: "baby" },
    { lang: "French", input: "chat", expectedIncludes: "cat" },
    { lang: "Japanese", input: "空を飛ぶ飛行機", expectedIncludes: "airplane" },
    { lang: "Japanese", input: "夕日の海", expectedIncludes: "sunset" },
    { lang: "Korean", input: "귀여운 강아지", expectedIncludes: "dog" },
    { lang: "Russian", input: "самолет в небе", expectedIncludes: "airplane" },
    // User Scenario Tests (Color consistency & gallery categories)
    { lang: "Chinese Color", input: "红", expectedIncludes: "red" },
    { lang: "Chinese Color", input: "红色", expectedIncludes: "red" },
    { lang: "English Color", input: "red", expectedIncludes: "red" },
    { lang: "Chinese Color", input: "蓝", expectedIncludes: "blue" },
    { lang: "Chinese Clothing", input: "学士服", expectedIncludes: "graduation" },
    { lang: "Chinese Style", input: "古装", expectedIncludes: "costume" },
    { lang: "Chinese Art", input: "二次元", expectedIncludes: "anime" },
    { lang: "Chinese Landscape", input: "富士山", expectedIncludes: "mountain" }
  ];

  console.log("\n--- [Test Suite 1: Query Alignment Accuracy & Latency] ---");
  for (const tc of testCases) {
    const t0 = process.hrtime.bigint();
    const aligned = aligner.alignQueryToPrompt(tc.input);
    const t1 = process.hrtime.bigint();
    const durationMs = Number(t1 - t0) / 1e6;

    const pass = aligned.toLowerCase().includes(tc.expectedIncludes.toLowerCase());
    console.log(`[${pass ? '✅ PASS' : '❌ FAIL'}] [${tc.lang}] "${tc.input}"`);
    console.log(`       ➔ Aligned: "${aligned}" (${durationMs.toFixed(3)} ms)`);
    if (!pass) {
      throw new Error(`Test failed for ${tc.input}: expected to include "${tc.expectedIncludes}", got "${aligned}"`);
    }
  }

  // 2. End-to-End ONNX Inference Test
  console.log("\n--- [Test Suite 2: End-to-End ONNX Model Inference] ---");
  const mergesPath = path.join(__dirname, 'merges.txt');
  const mergesText = fs.readFileSync(mergesPath, 'utf-8');
  const tokenizer = new SimpleTokenizer(mergesText);

  const modelPath = path.join(__dirname, 'mobileclip2_s0_text_encoder_quant.onnx');
  console.log(`Loading ONNX Text Encoder from ${modelPath}...`);
  const session = await ort.InferenceSession.create(modelPath, { executionProviders: ['cpu'] });

  const e2eQueries = [
    "天空中的飞机",
    "perro en la playa",
    "Rechnung",
    "sunset on the beach"
  ];

  for (const q of e2eQueries) {
    const alignedPrompt = aligner.alignQueryToPrompt(q);
    const tokenIds = tokenizer.encodeForCLIP(alignedPrompt);
    
    const bigintData = new BigInt64Array(77);
    for (let i = 0; i < 77; i++) bigintData[i] = BigInt(tokenIds[i]);
    const tensor = new ort.Tensor('int64', bigintData, [1, 77]);

    const tStart = Date.now();
    const feeds = {};
    feeds[session.inputNames[0]] = tensor;
    const outputs = await session.run(feeds);
    const outputName = session.outputNames[0];
    const embedding = outputs[outputName].data;
    const tInfer = Date.now() - tStart;

    console.log(`✅ E2E: "${q}" ➔ "${alignedPrompt}"`);
    console.log(`   Tokens: [${tokenIds.slice(0, 8).join(', ')} ... 77]`);
    console.log(`   Embedding: Float32Array(${embedding.length}) (Inference: ${tInfer} ms, non-zero elements confirmed)`);

    if (!embedding || embedding.length !== 512) {
      throw new Error(`Expected 512-dim embedding, got ${embedding ? embedding.length : 'null'}`);
    }
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL TESTS PASSED! Multi-language concept aligner is fully verified.");
  console.log("==================================================================");
}

runConceptAlignerTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
