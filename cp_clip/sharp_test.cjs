const sharp = require('sharp');
const path = require('path');
const { performance } = require('perf_hooks');
const fs = require('fs');

async function test() {
  const imagePath = path.join(__dirname, '../logo.png'); // or any large JPG
  if (!fs.existsSync(imagePath)) return console.error("no image");

  console.log("Method 1: Current approach (3 separate loads)");
  let start1 = performance.now();
  await sharp(imagePath).resize(256, 256).raw().toBuffer();
  await sharp(imagePath).resize(640, 640).raw().toBuffer();
  // simulate face crop
  await sharp(imagePath).resize(112, 112).raw().toBuffer();
  console.log(`Time 1: ${performance.now() - start1} ms`);

  console.log("\nMethod 2: Decode to memory buffer ONCE, then sharp(buffer)");
  let start2 = performance.now();
  const fileBuffer = fs.readFileSync(imagePath);
  await sharp(fileBuffer).resize(256, 256).raw().toBuffer();
  await sharp(fileBuffer).resize(640, 640).raw().toBuffer();
  await sharp(fileBuffer).resize(112, 112).raw().toBuffer();
  console.log(`Time 2: ${performance.now() - start2} ms`);

  console.log("\nMethod 3: Decode to intermediate RAW ONCE, then resize");
  let start3 = performance.now();
  // 1. shrink on load
  const { data: rawData, info } = await sharp(imagePath)
    .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  const sharpOpts = { raw: { width: info.width, height: info.height, channels: 3 } };
  
  await sharp(rawData, sharpOpts).resize(256, 256, { fit: 'cover' }).raw().toBuffer();
  await sharp(rawData, sharpOpts).resize(640, 640, { fit: 'fill' }).raw().toBuffer();
  await sharp(rawData, sharpOpts).resize(112, 112, { fit: 'fill' }).raw().toBuffer();
  console.log(`Time 3: ${performance.now() - start3} ms`);
}

test();
