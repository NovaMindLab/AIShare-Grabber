const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'resources', 'redist_x64');
const targetDirs = [
  path.join(__dirname, '..', 'node_modules', 'onnxruntime-node', 'bin', 'napi-v6', 'win32', 'x64'),
  path.join(__dirname, '..', 'node_modules', 'sqlite3', 'build', 'Release'),
  path.join(__dirname, '..', 'node_modules', 'sqlite3', 'lib', 'binding', 'napi-v6-win32-unknown-x64'),
];

if (!fs.existsSync(srcDir)) {
  console.log(`[copy-redist] Source directory does not exist: ${srcDir}, skipping.`);
  process.exit(0);
}

try {
  const files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.dll'));
  for (const targetDir of targetDirs) {
    if (fs.existsSync(targetDir)) {
      let count = 0;
      for (const file of files) {
        fs.copyFileSync(path.join(srcDir, file), path.join(targetDir, file));
        count++;
      }
      console.log(`[copy-redist] ✅ Deployed ${count} MSVC runtime DLLs to ${targetDir}`);
    }
  }
} catch (err) {
  console.warn(`[copy-redist] Warning during copying redist DLLs:`, err.message);
}
