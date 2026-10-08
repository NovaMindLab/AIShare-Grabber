#!/usr/bin/env node

/**
 * ShareCLIP - Multi-Channel Social & Developer Syndication
 * Automatically broadcasts release announcements to:
 * 1. Bluesky (AT Protocol microblogging with clickable facets & hashtags)
 * 2. Mastodon (Fediverse status update)
 * 3. DEV.to (Technical deep-dive release article draft/published)
 *
 * Usage:
 *   node scripts/broadcast-release.mjs [version] [--dry-run] [--publish]
 *
 * Environment variables:
 *   BLUESKY_HANDLE        - Bluesky username/handle (e.g. yourname.bsky.social)
 *   BLUESKY_APP_PASSWORD  - Bluesky app-specific password
 *   BLUESKY_SERVICE       - Optional Bluesky PDS / service URL (default: https://bsky.social)
 *   MASTODON_INSTANCE     - Mastodon instance (e.g. https://mastodon.social)
 *   MASTODON_ACCESS_TOKEN - Mastodon OAuth access token with write:statuses scope
 *   DEVTO_API_KEY         - DEV.to API key (from Settings -> Extensions)
 *   DEVTO_PUBLISH         - "true" to publish immediately on DEV.to, otherwise creates draft
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Parse CLI flags and arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d') || process.env.DRY_RUN === 'true';
const shouldPublishDevto = args.includes('--publish') || process.env.DEVTO_PUBLISH === 'true';

// Version detection
function resolveVersion() {
  const versionArg = args.find(a => !a.startsWith('-') && !a.startsWith('--'));
  if (versionArg) {
    return versionArg.startsWith('v') ? versionArg : `v${versionArg}`;
  }
  if (process.env.VERSION) {
    return process.env.VERSION.startsWith('v') ? process.env.VERSION : `v${process.env.VERSION}`;
  }
  if (process.env.TAG_VER) {
    return process.env.TAG_VER.startsWith('v') ? process.env.TAG_VER : `v${process.env.TAG_VER}`;
  }
  if (process.env.GITHUB_REF_NAME && /^v?\d+\.\d+/.test(process.env.GITHUB_REF_NAME)) {
    return process.env.GITHUB_REF_NAME.startsWith('v') ? process.env.GITHUB_REF_NAME : `v${process.env.GITHUB_REF_NAME}`;
  }
  try {
    const pkgPath = path.resolve(rootDir, 'cp_clip', 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) return `v${pkg.version}`;
    }
  } catch (_) {}
  return 'v4.5.8';
}

const tagVersion = resolveVersion();
const cleanVersion = tagVersion.replace(/^v/, '');

const REPO_URL = 'https://github.com/NovaMindLab/AIShare-Grabber';
const RELEASE_URL = `${REPO_URL}/releases/tag/${tagVersion}`;
const PORTAL_URL = 'https://novamindlab.github.io/AIShare-Grabber/';
const WIN_INSTALLER_URL = `${REPO_URL}/releases/download/${tagVersion}/ShareCLIP-Setup-${cleanVersion}.exe`;
const ANDROID_APK_URL = `${REPO_URL}/releases/download/${tagVersion}/ShareCLIP-Android-${cleanVersion}.apk`;

/**
 * Extract AT Protocol facets (byte slice indices for URLs & Hashtags)
 */
function extractBlueskyFacets(text) {
  const facets = [];
  const encoder = new TextEncoder();

  // Match URLs
  const urlRegex = /https?:\/\/[^\s)\]]+/g;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const startChar = match.index;
    const endChar = startChar + url.length;
    const byteStart = encoder.encode(text.slice(0, startChar)).length;
    const byteEnd = encoder.encode(text.slice(0, endChar)).length;
    facets.push({
      index: { byteStart, byteEnd },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: url
      }]
    });
  }

  // Match Hashtags (#word)
  const tagRegex = /(?:^|\s)(#[\w\d_]+)/g;
  while ((match = tagRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const hashTag = match[1];
    const tagWithoutHash = hashTag.slice(1);
    const startChar = match.index + (fullMatch.length - hashTag.length);
    const endChar = startChar + hashTag.length;
    const byteStart = encoder.encode(text.slice(0, startChar)).length;
    const byteEnd = encoder.encode(text.slice(0, endChar)).length;
    facets.push({
      index: { byteStart, byteEnd },
      features: [{
        $type: 'app.bsky.richtext.facet#tag',
        tag: tagWithoutHash
      }]
    });
  }

  return facets;
}

/**
 * 1. Bluesky Syndication Channel
 */
async function broadcastBluesky() {
  console.log('\n========================================');
  console.log('🦋 [Bluesky] Preparing Broadcast...');
  console.log('========================================');

  const handle = process.env.BLUESKY_HANDLE?.trim();
  const password = process.env.BLUESKY_APP_PASSWORD?.trim();
  const service = (process.env.BLUESKY_SERVICE?.trim() || 'https://bsky.social').replace(/\/+$/, '');

  const text = `🚀 ShareCLIP ${tagVersion} Released!

Local-First All-in-One Media Suite:
⚡ Private P2P AirDrop Alt (80+ MB/s)
🧠 On-Device AI Photo Search (MobileCLIP)
🎬 4K Multi-Site Video Downloader

👉 Release: ${RELEASE_URL}

#ShareCLIP #OpenSource #LocalFirst #AI`;

  const facets = extractBlueskyFacets(text);

  if (isDryRun) {
    console.log('🔍 [DRY-RUN] Bluesky Post Content:');
    console.log('----------------------------------------');
    console.log(text);
    console.log('----------------------------------------');
    console.log(`Length: ${text.length} chars (Bluesky limit: 300)`);
    console.log(`Detected Facets: ${facets.length}`);
    return { status: 'dry-run', channel: 'Bluesky' };
  }

  if (!handle || !password) {
    console.log('⚠️  [Bluesky] Broadcast SKIPPED: BLUESKY_HANDLE or BLUESKY_APP_PASSWORD not configured.');
    console.log('   👉 How to enable Bluesky syndication:');
    console.log('      1. Go to https://bsky.app -> Settings -> Privacy and Security -> App Passwords');
    console.log('      2. Generate an App Password (never use your primary account password)');
    console.log('      3. Add repository secrets: BLUESKY_HANDLE and BLUESKY_APP_PASSWORD');
    return { status: 'skipped', channel: 'Bluesky', reason: 'Missing credentials' };
  }

  try {
    console.log(`🔐 [Bluesky] Authenticating as @${handle} on ${service}...`);
    const sessionRes = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password })
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      throw new Error(`Authentication failed (${sessionRes.status}): ${errText}`);
    }

    const sessionData = await sessionRes.json();
    const { accessJwt, did } = sessionData;

    console.log(`📤 [Bluesky] Creating record in collection app.bsky.feed.post...`);
    const recordPayload = {
      repo: did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        createdAt: new Date().toISOString(),
        facets: facets.length > 0 ? facets : undefined
      }
    };

    const postRes = await fetch(`${service}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessJwt}`
      },
      body: JSON.stringify(recordPayload)
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      throw new Error(`Post creation failed (${postRes.status}): ${errText}`);
    }

    const postData = await postRes.json();
    console.log(`✅ [Bluesky] Broadcast published successfully! URI: ${postData.uri}`);
    return { status: 'success', channel: 'Bluesky', uri: postData.uri };
  } catch (error) {
    console.error(`❌ [Bluesky] Error during broadcast: ${error.message}`);
    return { status: 'failed', channel: 'Bluesky', error: error.message };
  }
}

/**
 * 2. Mastodon Syndication Channel
 */
async function broadcastMastodon() {
  console.log('\n========================================');
  console.log('🐘 [Mastodon] Preparing Broadcast...');
  console.log('========================================');

  let instance = process.env.MASTODON_INSTANCE?.trim();
  const token = process.env.MASTODON_ACCESS_TOKEN?.trim();

  if (instance && !instance.startsWith('http://') && !instance.startsWith('https://')) {
    instance = `https://${instance}`;
  }
  if (instance) {
    instance = instance.replace(/\/+$/, '');
  }

  const statusText = `🚀 ShareCLIP ${tagVersion} is here!
Local-first media powerhouse bridging Android, Windows, macOS, Linux & Web:
• ⚡ Zero-cloud P2P Wi-Fi transfer (80+ MB/s)
• 🧠 MobileCLIP2-S0 local AI photo search
• 🎬 4K Multi-site video downloader & detached player
• 🎨 AnimeGAN neural video style transfer
• 🌍 20 languages fully supported

📦 Release & Downloads:
${RELEASE_URL}

#ShareCLIP #OpenSource #LocalFirst #P2P #AirDrop #Privacy #AI`;

  if (isDryRun) {
    console.log('🔍 [DRY-RUN] Mastodon Post Content:');
    console.log('----------------------------------------');
    console.log(statusText);
    console.log('----------------------------------------');
    console.log(`Length: ${statusText.length} chars (Mastodon limit: 500)`);
    return { status: 'dry-run', channel: 'Mastodon' };
  }

  if (!instance || !token) {
    console.log('⚠️  [Mastodon] Broadcast SKIPPED: MASTODON_INSTANCE or MASTODON_ACCESS_TOKEN not configured.');
    console.log('   👉 How to enable Mastodon syndication:');
    console.log('      1. In your Mastodon instance (e.g. mastodon.social), go to Preferences -> Development -> New Application');
    console.log('      2. Name it "ShareCLIP Release Bot", grant scope "write:statuses"');
    console.log('      3. Add repository secrets: MASTODON_INSTANCE (e.g. https://mastodon.social) and MASTODON_ACCESS_TOKEN');
    return { status: 'skipped', channel: 'Mastodon', reason: 'Missing credentials' };
  }

  try {
    console.log(`📤 [Mastodon] Posting status to ${instance}/api/v1/statuses...`);
    const postRes = await fetch(`${instance}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: statusText,
        visibility: 'public'
      })
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      throw new Error(`Mastodon toot failed (${postRes.status}): ${errText}`);
    }

    const postData = await postRes.json();
    console.log(`✅ [Mastodon] Broadcast published successfully! URL: ${postData.url || postData.id}`);
    return { status: 'success', channel: 'Mastodon', url: postData.url || postData.id };
  } catch (error) {
    console.error(`❌ [Mastodon] Error during broadcast: ${error.message}`);
    return { status: 'failed', channel: 'Mastodon', error: error.message };
  }
}

/**
 * 3. DEV.to Technical Blog Publication Channel
 */
async function broadcastDevto() {
  console.log('\n========================================');
  console.log('👩‍💻 [DEV.to] Preparing Technical Article...');
  console.log('========================================');

  const apiKey = process.env.DEVTO_API_KEY?.trim();

  const title = `ShareCLIP ${tagVersion}: Local-First P2P Sharing, On-Device AI Photo Search & 4K Media Engine`;

  const bodyMarkdown = `---
title: ${title}
published: ${shouldPublishDevto}
description: Announcing ShareCLIP ${tagVersion} — Open-source zero-cloud AirDrop alternative, local MobileCLIP AI photo search, and 4K media downloader.
tags: opensource, privacy, webdev, productivity
canonical_url: ${RELEASE_URL}
cover_image: https://raw.githubusercontent.com/NovaMindLab/AIShare-Grabber/main/web/public/og-preview.png
---

## 🚀 Introducing ShareCLIP ${tagVersion}

We are excited to announce **ShareCLIP ${tagVersion}**, an open-source, local-first media powerhouse designed to bridge Android, Windows, macOS, Linux, and Web browsers with **zero cloud reliance**.

Traditional cross-device transfers force users into vendor lock-in (Apple AirDrop, Google Nearby Share) or cloud storage relays (Google Drive, WeTransfer) with file size caps, compression, and privacy concerns. 

ShareCLIP solves this with peer-to-peer WebRTC DataChannels over local Wi-Fi, paired with an embedded on-device multimodal AI engine and a universal 4K video downloader.

---

## ⚡ Key Highlights in ${tagVersion}

### 1. Zero Cloud P2P Sync (80+ MB/s)
* **Local LAN Saturation**: Files and photos stream directly between devices over local Wi-Fi or hotspot via WebRTC DataChannel.
* **Pure Browser Client**: [WebShare](${PORTAL_URL}webshare/) allows zero-install file receiving on any browser using WebGPU and IndexedDB caching.

### 2. On-Device AI Semantic Photo Search (MobileCLIP2-S0)
* **Offline Vector Index**: Runs Apple's MobileCLIP2 architecture locally via ONNX Runtime Web (WebGPU & WASM SIMD).
* **Zero Leakage**: Search your private photo library using natural language queries (*"red sports car on rainy street"*, *"receipt from Starbucks"*) without sending images to third-party LLMs.

### 3. 🎬 Detached HTML5 Video Player & 4K Universal Downloader
* **Universal Site Support**: Download media from YouTube, Bilibili, Douyin, TikTok, X, and 1000+ sites with automatic DASH stream merging.
* **Frameless Range 206 Streaming**: Detached always-on-top player window supporting smooth scrubbing with custom Electron protocol handlers.

### 4. 🎨 Neural Style Transfer & 20-Language Localization
* **AnimeGAN Video Studio**: Fast neural style transfer for video frames powered by ONNX Runtime.
* **Global Access**: 100% localized interface across 20 languages.

---

## 📦 Direct Downloads & Quick Start

* 💻 **Windows 64-bit**: [Download Installer (.exe)](${WIN_INSTALLER_URL})
* 📱 **Android**: [Download APK (.apk)](${ANDROID_APK_URL})
* 🍎 **macOS & 🐧 Linux**: [Download on GitHub Releases](${RELEASE_URL})
* 🌐 **WebShare P2P Portal**: [Open in Browser](${PORTAL_URL})

---

## 🛠️ Architecture Overview

\`\`\`
+-------------------+                   +-------------------+
|  ShareCLIP Mobile |   WebRTC (LAN)    |  ShareCLIP PC/Web |
|   (Flutter/Dart)  | <===============> |  (Electron/Vue3)  |
+-------------------+   80+ MB/s P2P    +-------------------+
          |                                       |
  [Camera / Storage]                     [MobileCLIP2-S0]
                                         [IndexedDB / Local]
\`\`\`

---

## 🌟 Open Source & Contributing

ShareCLIP is completely open source under the **MIT License**.

* ⭐️ **GitHub Repository**: [NovaMindLab/AIShare-Grabber](${REPO_URL})
* 💬 **Report Bugs & Feedback**: [GitHub Issues](${REPO_URL}/issues)

If you find ShareCLIP useful, please consider giving us a star on GitHub!
`;

  if (isDryRun) {
    console.log('🔍 [DRY-RUN] DEV.to Article Summary:');
    console.log('----------------------------------------');
    console.log(`Title: ${title}`);
    console.log(`Published Status: ${shouldPublishDevto ? 'LIVE (Public)' : 'DRAFT (Review mode)'}`);
    console.log(`Markdown Length: ${bodyMarkdown.length} characters (~${bodyMarkdown.split(/\s+/).length} words)`);
    console.log('----------------------------------------');
    return { status: 'dry-run', channel: 'DEV.to' };
  }

  if (!apiKey) {
    console.log('⚠️  [DEV.to] Article submission SKIPPED: DEVTO_API_KEY not configured.');
    console.log('   👉 How to enable DEV.to blog syndication:');
    console.log('      1. Log into https://dev.to/settings/extensions');
    console.log('      2. Scroll down to "DEV Community API Keys" and generate a key');
    console.log('      3. Add repository secret: DEVTO_API_KEY (and optionally DEVTO_PUBLISH=true)');
    return { status: 'skipped', channel: 'DEV.to', reason: 'Missing credentials' };
  }

  try {
    console.log(`📤 [DEV.to] Submitting article to https://dev.to/api/articles (published=${shouldPublishDevto})...`);
    const payload = {
      article: {
        title,
        published: shouldPublishDevto,
        body_markdown: bodyMarkdown,
        tags: ['opensource', 'privacy', 'webdev', 'productivity'],
        series: 'ShareCLIP Releases',
        canonical_url: RELEASE_URL,
        description: `Announcing ShareCLIP ${tagVersion} — Open-source zero-cloud AirDrop alternative, local MobileCLIP AI photo search, and 4K media downloader.`
      }
    };

    const postRes = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      throw new Error(`DEV.to API failed (${postRes.status}): ${errText}`);
    }

    const postData = await postRes.json();
    console.log(`✅ [DEV.to] Article successfully created! URL: ${postData.url || postData.canonical_url}`);
    return { status: 'success', channel: 'DEV.to', url: postData.url };
  } catch (error) {
    console.error(`❌ [DEV.to] Error during article submission: ${error.message}`);
    return { status: 'failed', channel: 'DEV.to', error: error.message };
  }
}

/**
 * Main execution coordinator
 */
async function main() {
  console.log(`\n📢 ShareCLIP Release Syndication & Social Broadcast`);
  console.log(`   Target Version: ${tagVersion} (${cleanVersion})`);
  console.log(`   Mode:           ${isDryRun ? 'DRY-RUN (Preview)' : 'LIVE EXECUTION'}`);
  console.log(`   DEV.to Target:  ${shouldPublishDevto ? 'PUBLISH' : 'DRAFT'}`);

  const results = [];

  // 1. Bluesky
  try {
    results.push(await broadcastBluesky());
  } catch (err) {
    results.push({ status: 'failed', channel: 'Bluesky', error: err.message });
  }

  // 2. Mastodon
  try {
    results.push(await broadcastMastodon());
  } catch (err) {
    results.push({ status: 'failed', channel: 'Mastodon', error: err.message });
  }

  // 3. DEV.to
  try {
    results.push(await broadcastDevto());
  } catch (err) {
    results.push({ status: 'failed', channel: 'DEV.to', error: err.message });
  }

  // Summary Report
  console.log('\n========================================');
  console.log('📊 Broadcast Summary Report');
  console.log('========================================');
  console.table(results.map(r => ({
    Channel: r.channel,
    Status: r.status === 'success' ? '✅ Success' : r.status === 'dry-run' ? '🔍 Dry-Run' : r.status === 'skipped' ? '⚠️ Skipped' : '❌ Failed',
    Details: r.uri || r.url || r.reason || r.error || (isDryRun ? 'Previewed' : 'Done')
  })));

  // Do not fail CI if secrets are omitted (graceful degradation)
  const hasFatalError = results.some(r => r.status === 'failed');
  if (hasFatalError) {
    console.warn('\n⚠️ One or more channels reported errors. Please check the logs above.');
  } else {
    console.log('\n✨ Multi-channel broadcast process finished smoothly.');
  }
}

main().catch(err => {
  console.error('Fatal broadcast error:', err);
  process.exit(1);
});
