#!/usr/bin/env node

/**
 * ShareCLIP - IndexNow Search Engine Instant Push & Sitemap Ping
 * Push latest URLs to Bing and IndexNow indexers
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webPublicDir = path.resolve(rootDir, 'web', 'public');

const HOST = 'novamindlab.github.io';
const BASE_URL = `https://${HOST}/AIShare-Grabber`;

const URL_LIST = [
  `${BASE_URL}/`,
  `${BASE_URL}/privacy.html`,
  `${BASE_URL}/webshare/`,
  `${BASE_URL}/webshare/mshare.html`
];

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow'
];

const BING_SITEMAP_PING_URL = `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`;

/**
 * 1. Find or generate a 32-char hex IndexNow key in web/public/<key>.txt
 */
function getOrGenerateKey() {
  if (!fs.existsSync(webPublicDir)) {
    fs.mkdirSync(webPublicDir, { recursive: true });
  }

  const hexPattern = /^[a-f0-9]{32}\.txt$/i;
  const existingFiles = fs.readdirSync(webPublicDir);
  const foundKeyFile = existingFiles.find(f => hexPattern.test(f));

  let key;
  if (foundKeyFile) {
    key = foundKeyFile.replace(/\.txt$/i, '');
    console.log(`[IndexNow] Existing key found: ${key} (${foundKeyFile})`);
    const filePath = path.join(webPublicDir, foundKeyFile);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (content !== key) {
      console.log(`[IndexNow] Correcting key file content in ${foundKeyFile}`);
      fs.writeFileSync(filePath, key, 'utf8');
    }
  } else {
    key = crypto.randomBytes(16).toString('hex');
    const newKeyFile = path.join(webPublicDir, `${key}.txt`);
    console.log(`[IndexNow] Generated new 32-char hex key: ${key}`);
    fs.writeFileSync(newKeyFile, key, 'utf8');
    console.log(`[IndexNow] Created key file at: ${newKeyFile}`);
  }

  return key;
}

/**
 * 2. Push URL list to IndexNow endpoints
 */
async function pushToIndexNow(key) {
  const payload = {
    host: HOST,
    key: key,
    keyLocation: `${BASE_URL}/${key}.txt`,
    urlList: URL_LIST
  };

  console.log('\n--- IndexNow Payload ---');
  console.log(JSON.stringify(payload, null, 2));
  console.log('------------------------\n');

  const results = [];

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    console.log(`[Push] Submitting to ${endpoint}...`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const status = response.status;
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (_) {}

      let statusMsg = '';
      if (status === 200) {
        statusMsg = '200 OK (URLs submitted successfully)';
      } else if (status === 202) {
        statusMsg = '202 Accepted (URLs received, IndexNow key validation pending)';
      } else if (status === 400) {
        statusMsg = '400 Bad Request (Invalid format or mismatch)';
      } else if (status === 403) {
        statusMsg = '403 Forbidden (Key not valid or keyLocation unreachable)';
      } else if (status === 422) {
        statusMsg = '422 Unprocessable Entity (URLs do not match host)';
      } else if (status === 429) {
        statusMsg = '429 Too Many Requests';
      } else {
        statusMsg = `${status} ${response.statusText}`;
      }

      console.log(`[Push Result] ${endpoint} -> ${statusMsg}`);
      if (bodyText) {
        console.log(`[Push Response Body] ${bodyText}`);
      }

      results.push({ endpoint, status, statusMsg, body: bodyText, success: [200, 202].includes(status) });
    } catch (err) {
      console.error(`[Push Error] Failed to reach ${endpoint}:`, err.message);
      results.push({ endpoint, status: 0, statusMsg: err.message, success: false });
    }
  }

  return results;
}

/**
 * 3. Ping Bing Sitemap
 */
async function pingBingSitemap() {
  console.log(`\n[Sitemap Ping] Pinging Bing: ${BING_SITEMAP_PING_URL}...`);
  try {
    const res = await fetch(BING_SITEMAP_PING_URL);
    console.log(`[Sitemap Ping] Bing Response: ${res.status} ${res.statusText}`);
    return { status: res.status, success: res.ok };
  } catch (err) {
    console.warn(`[Sitemap Ping Error] Failed to ping Bing:`, err.message);
    return { status: 0, error: err.message, success: false };
  }
}

async function main() {
  console.log('====================================================');
  console.log('  ShareCLIP SEO & Instant IndexNow Push Pipeline   ');
  console.log('====================================================\n');

  const key = getOrGenerateKey();
  const pushResults = await pushToIndexNow(key);
  const sitemapResult = await pingBingSitemap();

  console.log('\n====================================================');
  console.log('                    Summary Report                  ');
  console.log('====================================================');
  console.log(`Key: ${key}`);
  console.log(`Key Location: ${BASE_URL}/${key}.txt`);
  console.log(`URLs Pushed: ${URL_LIST.length}`);
  for (const r of pushResults) {
    console.log(`- ${r.endpoint}: ${r.statusMsg} ${r.success ? '✅' : '⚠️'}`);
  }
  console.log(`- Bing Sitemap Ping: ${sitemapResult.status} ${sitemapResult.success ? '✅' : '⚠️'}`);
  console.log('====================================================\n');

  const allPassed = pushResults.every(r => r.success);
  if (!allPassed) {
    console.log('[Notice] If key is freshly created, please ensure site is deployed to GitHub Pages so keyLocation can be verified.');
  }
}

main().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
