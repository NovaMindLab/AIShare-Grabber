const tm = require('./src/workers/task-manager.cjs');

tm.init('mobileclip2_s0_image_encoder.onnx', 'det_500m.onnx', 'w600k_mbf.onnx');

console.log("Queueing task...");
tm.computeClip('some/fake/path.jpg')
  .then(res => console.log("Success:", res))
  .catch(err => console.error("Error:", err));
