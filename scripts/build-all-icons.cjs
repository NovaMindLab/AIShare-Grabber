const fs = require('fs');
const path = require('path');
const sharp = require('../cp_clip/node_modules/sharp');

const projectRoot = path.resolve(__dirname, '..');
const svgPath = path.join(projectRoot, 'scratch', 'test_clean_logo.svg');

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
  console.log('🚀 Generating ShareCLIP Brand & App Icons from Option 4: Pure Vector Ice Prism (极简冰棱棱镜)...');

  // 1. Render 1024x1024 master icon directly from vector SVG with mathematical precision
  const icon1024 = await sharp(svgPath)
    .resize(1024, 1024)
    .png()
    .toBuffer();

  // 2. Generate multi-resolution icons
  const icon512 = await sharp(icon1024).resize(512, 512).png().toBuffer();
  const icon256 = await sharp(icon1024).resize(256, 256).png().toBuffer();
  const icon128 = await sharp(icon1024).resize(128, 128).png().toBuffer();
  const icon64 = await sharp(icon1024).resize(64, 64).png().toBuffer();
  const icon48 = await sharp(icon1024).resize(48, 48).png().toBuffer();
  const icon32 = await sharp(icon1024).resize(32, 32).png().toBuffer();
  const icon24 = await sharp(icon1024).resize(24, 24).png().toBuffer();
  const icon16 = await sharp(icon1024).resize(16, 16).png().toBuffer();

  // 3. Deploy Electron PC/Mac icons (cp_clip)
  console.log('📦 Deploying Electron PC/Mac icons...');
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'icon.png'), icon512);
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'build', 'icon.png'), icon1024);
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'public', 'icon.png'), icon512);
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'public', 'favicon.png'), icon64);
  fs.writeFileSync(path.join(projectRoot, 'logo.png'), icon1024);

  // 4. Build Windows .ico (16~256 multi-res)
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
  fs.writeFileSync(path.join(projectRoot, 'cp_clip', 'public', 'favicon.ico'), icoBuffer);

  // 5. Build macOS .icns (16~1024 Retina multi-res)
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

  // 6. Deploy Web Marketing & Portal Logos
  console.log('🌐 Deploying Web & WebShare brand assets...');
  fs.writeFileSync(path.join(projectRoot, 'web', 'public', 'pc_logo.png'), icon1024);
  fs.writeFileSync(path.join(projectRoot, 'web', 'public', 'android_logo.png'), icon1024);
  fs.writeFileSync(path.join(projectRoot, 'web', 'public', 'icon.png'), icon512);
  fs.writeFileSync(path.join(projectRoot, 'web', 'public', 'favicon.png'), icon64);
  fs.writeFileSync(path.join(projectRoot, 'webshare', 'public', 'logo.png'), icon1024);

  // 7. Deploy Android App Icons (Mipmaps)
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

  console.log('🎉 All platform brand logos & app icons generated successfully from Option 4!');
}

buildAllIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
