// scripts/prepare-store-assets.mjs
// Automatically generates optimized images, app icons, and screenshots for Microsoft Store submission
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('../cp_clip/node_modules/sharp');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'marketing/microsoft_store_assets');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('🎨 Generating Microsoft Store assets...');
console.log(`📂 Output Directory: ${outDir}\n`);

const iconSrc = path.resolve(rootDir, 'cp_clip/build/icon.png');

async function generateLogos() {
  const iconTargets = [
    { name: 'StoreLogo_300x300.png', width: 300, height: 300 },
    { name: 'StoreLogo_150x150.png', width: 150, height: 150 },
    { name: 'StoreLogo_50x50.png', width: 50, height: 50 },
    { name: 'Square44x44Logo.png', width: 44, height: 44 },
    { name: 'Square71x71Logo.png', width: 71, height: 71 },
    { name: 'Square150x150Logo.png', width: 150, height: 150 },
    { name: 'Square310x310Logo.png', width: 310, height: 310 },
  ];

  for (const t of iconTargets) {
    const dest = path.join(outDir, t.name);
    await sharp(iconSrc)
      .resize(t.width, t.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(dest);
    console.log(`  ✓ Created Icon: ${t.name} (${t.width}x${t.height})`);
  }

  // Wide Tile (310x150)
  const wideTile = path.join(outDir, 'Wide310x150Logo.png');
  // Create a 310x150 transparent canvas and composite resized icon in the center
  const iconBuffer = await sharp(iconSrc)
    .resize(130, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 310,
      height: 150,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // Deep slate blue background
    }
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(wideTile);
  console.log(`  ✓ Created Tile: Wide310x150Logo.png (310x150)`);
}

async function generateScreenshots() {
  const screenshotConfigs = [
    {
      src: 'docs/images/hero_banner.jpg',
      dest: 'Screenshot_1_Hero_1366x768.png',
      title: 'ShareCLIP Desktop Main Interface & Fast LAN Transfer'
    },
    {
      src: 'docs/images/ai_features.jpg',
      dest: 'Screenshot_2_Local_AI_PhotoSearch_1366x768.png',
      title: 'MobileCLIP On-Device Natural Language Search & Face Clustering'
    },
    {
      src: 'docs/images/p2p_pipeline.jpg',
      dest: 'Screenshot_3_Zero_Cloud_P2P_Sync_1366x768.png',
      title: 'Zero Cloud Wi-Fi Direct Transfer & Multi-Device Sync'
    }
  ];

  for (const s of screenshotConfigs) {
    const srcPath = path.resolve(rootDir, s.src);
    const destPath = path.join(outDir, s.dest);

    if (fs.existsSync(srcPath)) {
      await sharp(srcPath)
        .resize(1366, 768, { fit: 'cover' })
        .png({ quality: 95 })
        .toFile(destPath);
      console.log(`  ✓ Created Screenshot: ${s.dest} (1366x768) - ${s.title}`);
    } else {
      console.warn(`  ⚠ Source not found: ${srcPath}`);
    }
  }

  // Also create 1920x1080 version of Hero for Full HD showcases
  const heroFhd = path.join(outDir, 'Screenshot_Hero_1920x1080.png');
  if (fs.existsSync(path.resolve(rootDir, 'docs/images/hero_banner.jpg'))) {
    await sharp(path.resolve(rootDir, 'docs/images/hero_banner.jpg'))
      .resize(1920, 1080, { fit: 'cover' })
      .png({ quality: 95 })
      .toFile(heroFhd);
    console.log(`  ✓ Created Screenshot: Screenshot_Hero_1920x1080.png (1920x1080 FHD)`);
  }
}

async function main() {
  try {
    await generateLogos();
    await generateScreenshots();
    console.log('\n✨ All Microsoft Store visual assets successfully generated in marketing/microsoft_store_assets/ !');
  } catch (err) {
    console.error('❌ Error generating assets:', err);
    process.exit(1);
  }
}

main();
