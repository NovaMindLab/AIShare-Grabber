const fs = require('fs');
const path = require('path');

// Determine target platform (command line arg or process.platform)
const args = process.argv.slice(2);
let targetPlatform = process.platform;
for (const arg of args) {
  if (arg.startsWith('--platform=')) {
    targetPlatform = arg.split('=')[1].trim();
  }
}

const ortBinDir = path.join(__dirname, '..', 'node_modules', 'onnxruntime-node', 'bin', 'napi-v6');

if (!fs.existsSync(ortBinDir)) {
  console.log(`[prune-onnxruntime] Path not found: ${ortBinDir}, skipping.`);
  process.exit(0);
}

function getDirSize(dir) {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) size += getDirSize(full);
    else size += fs.statSync(full).size;
  }
  return size;
}

let totalRemovedBytes = 0;

function removeDir(dirPath, description) {
  if (fs.existsSync(dirPath)) {
    const size = getDirSize(dirPath);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      totalRemovedBytes += size;
      console.log(`[prune-onnxruntime] 🗑️ Removed ${description}: ${(size / (1024 * 1024)).toFixed(2)} MB (${dirPath})`);
    } catch (e) {
      console.warn(`[prune-onnxruntime] ⚠️ Could not remove ${dirPath}: ${e.message}`);
    }
  }
}

console.log(`[prune-onnxruntime] Pruning redundant native binaries for target platform: '${targetPlatform}'...`);

if (targetPlatform === 'win32') {
  // Windows x64 build: prune macOS, Linux, and Windows ARM64/IA32
  removeDir(path.join(ortBinDir, 'darwin'), 'macOS dylib binaries');
  removeDir(path.join(ortBinDir, 'linux'), 'Linux .so binaries');
  removeDir(path.join(ortBinDir, 'win32', 'arm64'), 'Windows ARM64 binaries');
  removeDir(path.join(ortBinDir, 'win32', 'ia32'), 'Windows 32-bit binaries');
} else if (targetPlatform === 'darwin') {
  // macOS build: prune Windows and Linux
  removeDir(path.join(ortBinDir, 'win32'), 'Windows DLL binaries');
  removeDir(path.join(ortBinDir, 'linux'), 'Linux .so binaries');
} else if (targetPlatform === 'linux') {
  // Linux x64 build: prune Windows, macOS, and Linux ARM64
  removeDir(path.join(ortBinDir, 'win32'), 'Windows DLL binaries');
  removeDir(path.join(ortBinDir, 'darwin'), 'macOS dylib binaries');
  removeDir(path.join(ortBinDir, 'linux', 'arm64'), 'Linux ARM64 binaries');
}

const totalRemovedMB = (totalRemovedBytes / (1024 * 1024)).toFixed(2);
console.log(`[prune-onnxruntime] ✅ Done! Saved ${totalRemovedMB} MB of redundant cross-platform binaries.`);
