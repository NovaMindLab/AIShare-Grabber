import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

// 1. Resolve target version
let version = process.argv[2];
if (!version) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('cp_clip/package.json'), 'utf8'));
    version = pkg.version;
  } catch (_) {
    version = '4.5.7';
  }
}
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

function getLocalFileSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

async function fetchDigestFromGitHubApi(targetRepo, tag, assetName) {
  const apiUrl = `https://api.github.com/repos/${targetRepo}/releases/tags/${tag}`;
  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'ShareCLIP-Manifest-Generator',
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    });
    if (!res.ok) return null;
    const release = await res.json();
    const asset = release.assets?.find(a => a.name === assetName);
    if (asset?.digest && asset.digest.startsWith('sha256:')) {
      return asset.digest.replace('sha256:', '').toUpperCase();
    }
  } catch (err) {
    console.warn(`[Manifest Generator] GitHub API lookup warning: ${err.message}`);
  }
  return null;
}

async function main() {
  let sha256 = process.argv[3] || process.env.INSTALLER_SHA256 || '';

  // 1. Check local build artifacts first
  if (!sha256) {
    const localCandidates = [
      path.resolve(`cp_clip/dist/ShareCLIP-Setup-${cleanVer}.exe`),
      path.resolve(`release-files/ShareCLIP-Setup-${cleanVer}.exe`),
      path.resolve(`all-dist-artifacts/release-windows/ShareCLIP-Setup-${cleanVer}.exe`)
    ];
    for (const cand of localCandidates) {
      const localHash = getLocalFileSha256(cand);
      if (localHash) {
        sha256 = localHash;
        console.log(`[Manifest Generator] Found local installer SHA256: ${sha256} from ${cand}`);
        break;
      }
    }
  }

  // 2. Check GitHub Release Asset digest (Instant, 0 MB download)
  if (!sha256) {
    const targetAsset = `ShareCLIP-Setup-${cleanVer}.exe`;
    const apiSha = await fetchDigestFromGitHubApi(repo, `v${cleanVer}`, targetAsset);
    if (apiSha) {
      sha256 = apiSha;
      console.log(`[Manifest Generator] Retrieved remote asset SHA256 via GitHub API: ${sha256}`);
    }
  }

  // 3. Fallback to streaming download if API did not return digest
  if (!sha256) {
    try {
      sha256 = await getSha256(installerUrl);
      console.log(`[Manifest Generator] Streamed Remote SHA256: ${sha256}`);
    } catch (e) {
      console.warn(`[Manifest Generator] Could not fetch remote file (${e.message}).`);
    }
  }

  if (!sha256) {
    sha256 = '0000000000000000000000000000000000000000000000000000000000000000';
    console.warn('[Manifest Generator] Using placeholder SHA256.');
  }

  // 1. Update Scoop Manifest
  const scoopPath = path.resolve('manifests/scoop/shareclip.json');
  if (fs.existsSync(scoopPath)) {
    const scoopContent = JSON.parse(fs.readFileSync(scoopPath, 'utf8'));
    scoopContent.version = cleanVer;
    scoopContent.architecture['64bit'].url = `https://github.com/${repo}/releases/download/v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe#/dl.7z`;
    if (sha256 !== '0000000000000000000000000000000000000000000000000000000000000000') {
      scoopContent.architecture['64bit'].hash = sha256;
    }
    fs.writeFileSync(scoopPath, JSON.stringify(scoopContent, null, 2), 'utf8');
    console.log(`[Manifest Generator] Updated Scoop manifest: ${scoopPath}`);
  }

  // 2. Update WinGet Single-file Manifest
  const wingetSingletonPath = path.resolve('manifests/winget/NovaMindLab.ShareCLIP.yaml');
  if (fs.existsSync(wingetSingletonPath)) {
    let wingetContent = fs.readFileSync(wingetSingletonPath, 'utf8');
    wingetContent = wingetContent.replace(/PackageVersion:\s*[0-9\.]+/g, `PackageVersion: ${cleanVer}`);
    wingetContent = wingetContent.replace(/v[0-9\.]+\/ShareCLIP-Setup-[0-9\.]+\.exe/g, `v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe`);
    wingetContent = wingetContent.replace(/releases\/tag\/v[0-9\.]+/g, `releases/tag/v${cleanVer}`);
    if (sha256 !== '0000000000000000000000000000000000000000000000000000000000000000') {
      wingetContent = wingetContent.replace(/InstallerSha256:\s*[0-9A-Fa-f]+/g, `InstallerSha256: ${sha256}`);
    }
    fs.writeFileSync(wingetSingletonPath, wingetContent, 'utf8');
    console.log(`[Manifest Generator] Updated WinGet singleton manifest: ${wingetSingletonPath}`);
  }

  // 3. Generate Official winget-pkgs 3-file Structured Directory
  const wingetPkgDir = path.resolve(`manifests/winget/n/NovaMindLab/ShareCLIP/${cleanVer}`);
  fs.mkdirSync(wingetPkgDir, { recursive: true });

  const versionYaml = `# yaml-language-server: $schema=https://aka.ms/winget-manifest.version.1.6.0.schema.json
PackageIdentifier: NovaMindLab.ShareCLIP
PackageVersion: ${cleanVer}
DefaultLocale: en-US
ManifestType: version
ManifestVersion: 1.6.0
`;

  const installerYaml = `# yaml-language-server: $schema=https://aka.ms/winget-manifest.installer.1.6.0.schema.json
PackageIdentifier: NovaMindLab.ShareCLIP
PackageVersion: ${cleanVer}
InstallerType: nullsoft
InstallModes:
  - interactive
  - silent
  - silentWithProgress
Installers:
  - Architecture: x64
    InstallerUrl: https://github.com/${repo}/releases/download/v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe
    InstallerSha256: ${sha256}
    Scope: user
ManifestType: installer
ManifestVersion: 1.6.0
`;

  const localeYaml = `# yaml-language-server: $schema=https://aka.ms/winget-manifest.defaultLocale.1.6.0.schema.json
PackageIdentifier: NovaMindLab.ShareCLIP
PackageVersion: ${cleanVer}
PackageLocale: en-US
Publisher: NovaMindLab
PublisherUrl: https://github.com/NovaMindLab
PublisherSupportUrl: https://github.com/${repo}/issues
PrivacyUrl: https://novamindlab.github.io/AIShare-Grabber/privacy.html
PackageName: ShareCLIP
PackageUrl: https://novamindlab.github.io/AIShare-Grabber/
License: MIT
LicenseUrl: https://github.com/${repo}/blob/main/LICENSE
Copyright: Copyright (c) 2026 ShareCLIP Team
ShortDescription: Private P2P AirDrop Alternative, Local AI Photo Search & Media Manager
Description: |
  ShareCLIP is a 100% private, cross-platform media suite.
  - High-speed local Wi-Fi / WebRTC P2P sync between Android and PC/Mac (AirDrop Alternative).
  - 100% On-Device AI Photo Search using MobileCLIP, facial recognition & geolocation map.
  - 4K multi-site video downloader with standalone detached player window.
  - Zero cloud reliance, zero subscriptions, complete data sovereignty.
Moniker: shareclip
Tags:
  - airdrop
  - p2p
  - photo-sync
  - ai-gallery
  - privacy
  - webrtc
  - video-downloader
ReleaseNotesUrl: https://github.com/${repo}/releases/tag/v${cleanVer}
ManifestType: defaultLocale
ManifestVersion: 1.6.0
`;

  fs.writeFileSync(path.join(wingetPkgDir, 'NovaMindLab.ShareCLIP.yaml'), versionYaml, 'utf8');
  fs.writeFileSync(path.join(wingetPkgDir, 'NovaMindLab.ShareCLIP.installer.yaml'), installerYaml, 'utf8');
  fs.writeFileSync(path.join(wingetPkgDir, 'NovaMindLab.ShareCLIP.locale.en-US.yaml'), localeYaml, 'utf8');
  console.log(`[Manifest Generator] Generated winget-pkgs official manifests in: ${wingetPkgDir}`);

  console.log('[Manifest Generator] Package manager manifests generated successfully!');
}

main();
