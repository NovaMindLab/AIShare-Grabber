const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'resources', 'redist_x64');
const targetDir = path.join(__dirname, '..', 'node_modules', 'onnxruntime-node', 'bin', 'napi-v6', 'win32', 'x64');

if (!fs.existsSync(srcDir)) {
  console.log(`[copy-redist] Source directory does not exist: ${srcDir}, skipping.`);
  process.exit(0);
}

if (!fs.existsSync(targetDir)) {
  console.log(`[copy-redist] onnxruntime-node target directory does not exist yet: ${targetDir}, skipping.`);
  process.exit(0);
}

try {
  const files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.dll'));
  let count = 0;
  for (const file of files) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(targetDir, file);
    fs.copyFileSync(srcFile, destFile);
    count++;
  }
  console.log(`[copy-redist] ✅ Successfully deployed ${count} MSVC runtime DLLs to ${targetDir}`);
} catch (err) {
  console.warn(`[copy-redist] Warning during copying redist DLLs:`, err.message);
}
