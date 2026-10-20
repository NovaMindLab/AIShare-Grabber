const fs = require('fs');
const path = require('path');
const sharp = require('../cp_clip/node_modules/sharp');

const projectRoot = path.resolve(__dirname, '..');
const inputPath = 'C:/Users/houqi/.gemini/antigravity/brain/c9ba3cad-0a7e-4a72-8227-bb133bcd41a4/shareclip_icon_photon_ring_1792473427481.jpg';

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerLen = 6;
  const dirEntryLen = 16;
  let offset = headerLen + count * dirEntryLen;

  const header = Buffer.alloc(headerLen);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(dirEntryLen);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(img => img.buffer)]);
}

function createIcns(chunkMap) {
  let totalLength = 8;
  const chunkBuffers = [];
  for (const chunk of chunkMap) {
    const chunkHeader = Buffer.alloc(8);
    chunkHeader.write(chunk.ostype, 0, 4, 'ascii');
    const chunkSize = 8 + chunk.buffer.length;
    chunkHeader.writeUInt32BE(chunkSize, 4);
    chunkBuffers.push(chunkHeader, chunk.buffer);
    totalLength += chunkSize;
  }
  const fileHeader = Buffer.alloc(8);
  fileHeader.write('icns', 0, 4, 'ascii');
  fileHeader.writeUInt32BE(totalLength, 4);
  return Buffer.concat([fileHeader, ...chunkBuffers]);
}

async function buildAllIcons() {
  console.log('🚀 Generating ShareCLIP Brand & App Icons from Option 3 (Photon Lens)...');

  // 1. Crop original 768x768 squircle from high-res source
  const cropped768 = await sharp(inputPath)
    .extract({ left: 127, top: 125, width: 768, height: 768 })
    .toBuffer();

  // 2. Full-bleed 1024x1024 squircle (cropped edges, beautiful rounded corners)
  const squircle824 = await sharp(cropped768)
    .resize(824, 824, { fit: 'cover' })
    .toBuffer();

  const maskSvg = Buffer.from(`
    <svg width="824" height="824" viewBox="0 0 824 824">
      <rect x="0" y="0" width="824" height="824" rx="185" fill="#FFFFFF"/>
    </svg>
  `);

  const maskedSquircle824 = await sharp(squircle824)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 3. Apple macOS 1024x1024 Canvas (824x824 squircle centered with elegant drop shadow)
  const shadowSvg = Buffer.from(`
    <svg width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000000" flood-opacity="0.45"/>
        </filter>
      </defs>
      <rect x="100" y="100" width="824" height="824" rx="185" fill="#000000" filter="url(#shadow)"/>
    </svg>
  `);

  const icon1024 = await sharp(shadowSvg)
    .composite([{ input: maskedSquircle824, top: 100, left: 100 }])
    .png()
    .toBuffer();

  // 4. Generate 512x512
  const icon512 = await sharp(icon1024).resize(512, 512).png().toBuffer();
  const icon256 = await sharp(icon1024).resize(256, 256).png().toBuffer();
  const icon128 = await sharp(icon1024).resize(128, 128).png().toBuffer();
  const icon64 = await sharp(icon1024).resize(64, 64).png().toBuffer();
  const icon48 = await sharp(icon1024).resize(48, 48).png().toBuffer();
  const icon32 = await sharp(icon1024).resize(32, 32).png().toBuffer();
  const icon24 = await sharp(icon1024).resize(24, 24).png().toBuffer();
  const icon16 = await sharp(icon1024).resize(16, 16).png().toBuffer();

  // 5. Deploy Desktop Icons (cp_clip)
  console.log('📦 Deploying Electron PC/Mac icons...');
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'icon.png'), icon512);
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'build', 'icon.png'), icon1024);

  // 6. Build Windows .ico
  console.log('🪟 Building Windows multi-resolution icon.ico...');
  const icoBuffer = createIco([
    { width: 256, height: 256, buffer: icon256 },
    { width: 128, height: 128, buffer: icon128 },
    { width: 64, height: 64, buffer: icon64 },
    { width: 48, height: 48, buffer: icon48 },
    { width: 32, height: 32, buffer: icon32 },
    { width: 24, height: 24, buffer: icon24 },
    { width: 16, height: 16, buffer: icon16 }
  ]);
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'build', 'icon.ico'), icoBuffer);

  // 7. Build macOS .icns
  console.log('🍎 Building macOS multi-resolution icon.icns...');
  const icnsBuffer = createIcns([
    { ostype: 'ic10', buffer: icon1024 },
    { ostype: 'ic09', buffer: icon512 },
    { ostype: 'ic08', buffer: icon256 },
    { ostype: 'ic07', buffer: icon128 },
    { ostype: 'icp6', buffer: icon64 },
    { ostype: 'icp5', buffer: icon32 },
    { ostype: 'icp4', buffer: icon16 }
  ]);
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'build', 'icon.icns'), icnsBuffer);

  // 8. Deploy Web Marketing & Portal Logos
  console.log('🌐 Deploying Web & WebShare brand assets...');
  fs.writeFileSync(path.join(projectRoot, 'web', 'public', 'pc_logo.png'), icon1024);
  fs.writeFileSync(path.join(projectRoot, 'web', 'public', 'android_logo.png'), icon1024);
  fs.writeFileSync(path.join(projectRoot, 'webshare', 'public', 'logo.png'), icon1024);

  // 9. Deploy Android App Icons (Mipmaps)
  console.log('📱 Deploying Android adaptive mipmap icons...');
  const androidResDir = path.join(projectRoot, 'android', 'android', 'app', 'src', 'main', 'res');
  
  const mipmapSizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const m of mipmapSizes) {
    const targetDir = path.join(androidResDir, m.dir);
    if (fs.existsSync(targetDir)) {
      const resized = await sharp(icon1024).resize(m.size, m.size).png().toBuffer();
      fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), resized);
      console.log(`  ✓ ${m.dir}/ic_launcher.png (${m.size}x${m.size})`);
    }
  }

  console.log('🎉 All platform brand logos & app icons generated successfully!');
}

buildAllIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
