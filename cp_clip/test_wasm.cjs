const ort = require('onnxruntime-web');
const path = require('path');

async function test() {
  try {
    ort.env.wasm.wasmPaths = __dirname + '/node_modules/onnxruntime-web/dist/';
    ort.env.wasm.numThreads = 1;

    console.log('Loading text encoder via WASM...');
    const textModelPath = path.join(__dirname, 'mobileclip2_s0_text_encoder_quant.onnx');
    const session = await ort.InferenceSession.create(textModelPath, { executionProviders: ['wasm'] });
    console.log('Successfully loaded WASM session!');
    
    // Quick inference test
    const bigintData = new BigInt64Array(77);
    const tensor = new ort.Tensor('int64', bigintData, [1, 77]);
    const feeds = {};
    feeds[session.inputNames[0]] = tensor;
    
    const output = await session.run(feeds);
    console.log('Inference successful. Output shape:', output[session.outputNames[0]].dims);
  } catch (err) {
    console.error('WASM test failed:', err);
  }
}
test();
