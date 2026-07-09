const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'cp_clip', 'build', 'icon.png');
const icoPath = path.join(__dirname, '..', 'cp_clip', 'build', 'icon.ico');

if (!fs.existsSync(pngPath)) {
  console.error(`Error: Source PNG not found at ${pngPath}`);
  process.exit(1);
}

try {
  const pngBuffer = fs.readFileSync(pngPath);
  const pngSize = pngBuffer.length;

  // ICO header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 for Icon
  header.writeUInt16LE(1, 4); // Number of images: 1

  // Icon entry (16 bytes)
  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // Width: 256 (0 means 256)
  entry.writeUInt8(0, 1); // Height: 256 (0 means 256)
  entry.writeUInt8(0, 2); // Colors: 0 (no palette)
  entry.writeUInt8(0, 3); // Reserved: 0
  entry.writeUInt16LE(1, 4); // Color planes: 1
  entry.writeUInt16LE(32, 6); // Bits per pixel: 32
  entry.writeUInt32LE(pngSize, 8); // Image size in bytes
  entry.writeUInt32LE(22, 12); // Offset: 6 (header) + 16 (entry) = 22

  // Combine and write
  const icoBuffer = Buffer.concat([header, entry, pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`🎉 Successfully generated standard ICO file at ${icoPath} (${icoBuffer.length} bytes)`);
} catch (err) {
  console.error('Error generating ICO file:', err);
  process.exit(1);
}
