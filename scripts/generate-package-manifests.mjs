import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

const version = process.argv[2] || '3.0.17';
const cleanVer = version.replace(/^v/, '');
const repo = 'NovaMindLab/AIShare-Grabber';
const installerUrl = `https://github.com/${repo}/releases/download/v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe`;

console.log(`[Manifest Generator] Generating package manifests for version v${cleanVer}...`);

function getSha256(url) {
  return new Promise((resolve, reject) => {
    console.log(`[Manifest Generator] Fetching ${url}...`);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return getSha256(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      const hash = crypto.createHash('sha256');
      res.on('data', (chunk) => hash.update(chunk));
      res.on('end', () => resolve(hash.digest('hex').toUpperCase()));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  let sha256 = '0000000000000000000000000000000000000000000000000000000000000000';
  try {
    sha256 = await getSha256(installerUrl);
    console.log(`[Manifest Generator] SHA256: ${sha256}`);
  } catch (e) {
    console.warn(`[Manifest Generator] Could not fetch remote file (release might still be building). Using placeholder. (${e.message})`);
  }

  // Update Scoop
  const scoopPath = path.resolve('manifests/scoop/shareclip.json');
  if (fs.existsSync(scoopPath)) {
    const scoopContent = JSON.parse(fs.readFileSync(scoopPath, 'utf8'));
    scoopContent.version = cleanVer;
    scoopContent.architecture['64bit'].url = `https://github.com/${repo}/releases/download/v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe#/dl.7z`;
    if (sha256 !== '0000000000000000000000000000000000000000000000000000000000000000') {
      scoopContent.architecture['64bit'].hash = sha256;
    }
    fs.writeFileSync(scoopPath, JSON.stringify(scoopContent, null, 2), 'utf8');
    console.log(`[Manifest Generator] Updated ${scoopPath}`);
  }

  // Update WinGet
  const wingetPath = path.resolve('manifests/winget/NovaMindLab.ShareCLIP.yaml');
  if (fs.existsSync(wingetPath)) {
    let wingetContent = fs.readFileSync(wingetPath, 'utf8');
    wingetContent = wingetContent.replace(/PackageVersion:\s*[0-9\.]+/g, `PackageVersion: ${cleanVer}`);
    wingetContent = wingetContent.replace(/v[0-9\.]+\/ShareCLIP-Setup-[0-9\.]+\.exe/g, `v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe`);
    wingetContent = wingetContent.replace(/releases\/tag\/v[0-9\.]+/g, `releases/tag/v${cleanVer}`);
    if (sha256 !== '0000000000000000000000000000000000000000000000000000000000000000') {
      wingetContent = wingetContent.replace(/InstallerSha256:\s*[0-9A-Fa-f]+/g, `InstallerSha256: ${sha256}`);
    }
    fs.writeFileSync(wingetPath, wingetContent, 'utf8');
    console.log(`[Manifest Generator] Updated ${wingetPath}`);
  }

  console.log('[Manifest Generator] Package manager manifests generated successfully!');
}

main();
