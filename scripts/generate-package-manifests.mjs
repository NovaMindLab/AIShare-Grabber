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
    version = '4.5.8';
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

async function fetchReleaseAssetDigests(targetRepo, tag) {
  const apiUrl = `https://api.github.com/repos/${targetRepo}/releases/tags/${tag}`;
  const digests = new Map();
  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'ShareCLIP-Manifest-Generator',
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    });
    if (!res.ok) return digests;
    const release = await res.json();
    if (Array.isArray(release.assets)) {
      for (const asset of release.assets) {
        if (asset.digest && asset.digest.startsWith('sha256:')) {
          digests.set(asset.name, asset.digest.replace('sha256:', '').toUpperCase());
        }
      }
    }
  } catch (err) {
    console.warn(`[Manifest Generator] GitHub API lookup warning: ${err.message}`);
  }
  return digests;
}

async function main() {
  const remoteDigests = await fetchReleaseAssetDigests(repo, `v${cleanVer}`);

  // 1. Resolve Windows SHA256
  let winSha256 = process.argv[3] || process.env.INSTALLER_SHA256 || '';
  if (!winSha256) {
    const localCandidates = [
      path.resolve(`cp_clip/dist_electron/ShareCLIP-Setup-${cleanVer}.exe`),
      path.resolve(`cp_clip/dist/ShareCLIP-Setup-${cleanVer}.exe`),
      path.resolve(`release-files/ShareCLIP-Setup-${cleanVer}.exe`),
      path.resolve(`all-dist-artifacts/release-windows/ShareCLIP-Setup-${cleanVer}.exe`)
    ];
    for (const cand of localCandidates) {
      const localHash = getLocalFileSha256(cand);
      if (localHash) {
        winSha256 = localHash;
        console.log(`[Manifest Generator] Found local installer SHA256: ${winSha256} from ${cand}`);
        break;
      }
    }
  }

  if (!winSha256) {
    const apiSha = remoteDigests.get(`ShareCLIP-Setup-${cleanVer}.exe`);
    if (apiSha) {
      winSha256 = apiSha;
      console.log(`[Manifest Generator] Retrieved Windows installer SHA256 via GitHub API: ${winSha256}`);
    }
  }

  if (!winSha256) {
    try {
      winSha256 = await getSha256(installerUrl);
      console.log(`[Manifest Generator] Streamed Remote Windows SHA256: ${winSha256}`);
    } catch (e) {
      console.warn(`[Manifest Generator] Could not fetch remote file (${e.message}).`);
    }
  }

  if (!winSha256) {
    winSha256 = '0000000000000000000000000000000000000000000000000000000000000000';
    console.warn('[Manifest Generator] Using placeholder Windows SHA256.');
  }

  // 2. Resolve macOS SHA256 (arm64 & x64)
  const macArmSha = remoteDigests.get(`ShareCLIP-Mac-${cleanVer}-arm64.dmg`) ||
    getLocalFileSha256(path.resolve(`cp_clip/dist_electron/ShareCLIP-Mac-${cleanVer}-arm64.dmg`)) ||
    '0000000000000000000000000000000000000000000000000000000000000000';

  const macX64Sha = remoteDigests.get(`ShareCLIP-Mac-${cleanVer}-x64.dmg`) ||
    getLocalFileSha256(path.resolve(`cp_clip/dist_electron/ShareCLIP-Mac-${cleanVer}-x64.dmg`)) ||
    '0000000000000000000000000000000000000000000000000000000000000000';

  // 3. Resolve Android APK SHA256
  const androidSha = remoteDigests.get(`ShareCLIP-Android-${cleanVer}.apk`) ||
    getLocalFileSha256(path.resolve(`app/build/outputs/apk/release/app-release.apk`)) ||
    getLocalFileSha256(path.resolve(`web/public/app-release.apk`)) ||
    '0000000000000000000000000000000000000000000000000000000000000000';

  // ---------------------------------------------------------------------
  // Output 1: Update Scoop Manifest
  // ---------------------------------------------------------------------
  const scoopDir = path.resolve('manifests/scoop');
  fs.mkdirSync(scoopDir, { recursive: true });
  const scoopPath = path.join(scoopDir, 'shareclip.json');
  let scoopContent = {
    version: cleanVer,
    description: "Private P2P AirDrop Alternative, Local AI Photo Search & Media Suite",
    homepage: "https://novamindlab.github.io/AIShare-Grabber/",
    license: "MIT",
    architecture: {
      "64bit": {
        url: `https://github.com/${repo}/releases/download/v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe#/dl.7z`,
        hash: winSha256
      }
    },
    shortcuts: [
      ["ShareCLIP.exe", "ShareCLIP"]
    ],
    checkver: {
      github: `https://github.com/${repo}`
    },
    autoupdate: {
      architecture: {
        "64bit": {
          url: `https://github.com/${repo}/releases/download/v$version/ShareCLIP-Setup-$version.exe#/dl.7z`
        }
      }
    }
  };

  if (fs.existsSync(scoopPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(scoopPath, 'utf8'));
      scoopContent = { ...existing, ...scoopContent };
      scoopContent.version = cleanVer;
      scoopContent.architecture['64bit'].url = `https://github.com/${repo}/releases/download/v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe#/dl.7z`;
      if (winSha256 !== '0000000000000000000000000000000000000000000000000000000000000000') {
        scoopContent.architecture['64bit'].hash = winSha256;
      }
    } catch (_) {}
  }
  fs.writeFileSync(scoopPath, JSON.stringify(scoopContent, null, 2), 'utf8');
  console.log(`[Manifest Generator] Updated Scoop manifest: ${scoopPath}`);

  // ---------------------------------------------------------------------
  // Output 2: Update WinGet Single-file Manifest
  // ---------------------------------------------------------------------
  const wingetDir = path.resolve('manifests/winget');
  fs.mkdirSync(wingetDir, { recursive: true });
  const wingetSingletonPath = path.join(wingetDir, 'NovaMindLab.ShareCLIP.yaml');
  if (fs.existsSync(wingetSingletonPath)) {
    let wingetContent = fs.readFileSync(wingetSingletonPath, 'utf8');
    wingetContent = wingetContent.replace(/PackageVersion:\s*[0-9\.]+/g, `PackageVersion: ${cleanVer}`);
    wingetContent = wingetContent.replace(/v[0-9\.]+\/ShareCLIP-Setup-[0-9\.]+\.exe/g, `v${cleanVer}/ShareCLIP-Setup-${cleanVer}.exe`);
    wingetContent = wingetContent.replace(/releases\/tag\/v[0-9\.]+/g, `releases/tag/v${cleanVer}`);
    if (winSha256 !== '0000000000000000000000000000000000000000000000000000000000000000') {
      wingetContent = wingetContent.replace(/InstallerSha256:\s*[0-9A-Fa-f]+/g, `InstallerSha256: ${winSha256}`);
    }
    fs.writeFileSync(wingetSingletonPath, wingetContent, 'utf8');
    console.log(`[Manifest Generator] Updated WinGet singleton manifest: ${wingetSingletonPath}`);
  }

  // ---------------------------------------------------------------------
  // Output 3: Generate Official winget-pkgs 3-file Structured Directory
  // ---------------------------------------------------------------------
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
    InstallerSha256: ${winSha256}
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

  // ---------------------------------------------------------------------
  // Output 4: Generate Homebrew Cask Formula (shareclip.rb)
  // ---------------------------------------------------------------------
  const homebrewDir = path.resolve('manifests/homebrew');
  fs.mkdirSync(homebrewDir, { recursive: true });

  const homebrewCask = `cask "shareclip" do
  arch arm: "arm64", intel: "x64"

  version "${cleanVer}"
  sha256 arm:   "${macArmSha.toLowerCase()}",
         intel: "${macX64Sha.toLowerCase()}"

  url "https://github.com/${repo}/releases/download/v#{version}/ShareCLIP-Mac-#{version}-#{arch}.dmg",
      verified: "github.com/${repo}/"
  name "ShareCLIP"
  desc "Local-first P2P file transfer and on-device AI photo gallery"
  homepage "https://novamindlab.github.io/AIShare-Grabber/"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :catalina"

  app "ShareCLIP.app"

  zap trash: [
    "~/Library/Application Support/ShareCLIP",
    "~/Library/Preferences/com.shareclip.album.sync.plist",
    "~/Library/Saved Application State/com.shareclip.album.sync.savedState",
    "~/Library/Logs/ShareCLIP",
  ]
end
`;

  const brewFormulaPath = path.join(homebrewDir, 'shareclip.rb');
  fs.writeFileSync(brewFormulaPath, homebrewCask, 'utf8');
  console.log(`[Manifest Generator] Generated Homebrew Cask formula: ${brewFormulaPath}`);

  // ---------------------------------------------------------------------
  // Output 5: Generate IzzyOnDroid Metadata & Release Snapshot
  // ---------------------------------------------------------------------
  const izzyDir = path.resolve('manifests/izzyondroid');
  fs.mkdirSync(izzyDir, { recursive: true });

  const izzyMetadata = {
    applicationId: "com.novamindlab.image_clip",
    appName: "ShareCLIP",
    version: cleanVer,
    versionCode: 458,
    releaseDate: new Date().toISOString().split('T')[0],
    sourceCodeUrl: `https://github.com/${repo}`,
    issueTrackerUrl: `https://github.com/${repo}/issues`,
    apkAssetUrl: `https://github.com/${repo}/releases/download/v${cleanVer}/ShareCLIP-Android-${cleanVer}.apk`,
    apkSha256: androidSha.toLowerCase(),
    license: "MIT",
    categories: ["Connectivity", "Multimedia", "Security", "Tools"],
    antiFeatures: [],
    minSdkVersion: 26,
    targetSdkVersion: 34,
    description: {
      en: "Privacy-first P2P AirDrop alternative and on-device MobileCLIP AI photo gallery with zero cloud reliance.",
      zh: "私有局域网极速互传 AirDrop 替代品与端侧离线 AI 语义搜图相册，零云端无限制。"
    }
  };

  const izzyMetaPath = path.join(izzyDir, 'metadata.json');
  fs.writeFileSync(izzyMetaPath, JSON.stringify(izzyMetadata, null, 2), 'utf8');
  console.log(`[Manifest Generator] Generated IzzyOnDroid metadata: ${izzyMetaPath}`);

  console.log('\n[Manifest Generator] All package manager manifests generated successfully!');
}

main();
