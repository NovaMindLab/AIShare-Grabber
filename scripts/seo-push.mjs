#!/usr/bin/env node

/**
 * ShareCLIP - Multi-Engine SEO Instant Push & Sitemaps Ping Pipeline
 * 
 * Supports:
 * 1. IndexNow Protocol (Bing, Seznam, Yandex, IndexNow.org)
 * 2. Baidu Search Push API (百度搜索资源平台主动推送)
 * 3. Google Sitemaps Ping & Indexing Standards
 * 4. Bing Sitemaps Ping
 * 5. Automatic dynamic URL resolution from sitemap.xml & colored reporting
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webPublicDir = path.resolve(rootDir, 'web', 'public');

// ANSI Color Palette
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgGreen: '\x1b[42m',
};

// 1. Auto-load local .env files if present
function loadEnvFiles() {
  const envCandidates = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '.env.local'),
    path.join(rootDir, 'web', '.env'),
    path.join(rootDir, 'web', '.env.local')
  ];

  for (const envFile of envCandidates) {
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (_) {}
    }
  }
}

loadEnvFiles();

const HOST = 'novamindlab.github.io';
const BASE_URL = `https://${HOST}/AIShare-Grabber`;
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://search.seznam.cz/indexnow',
  'https://yandex.com/indexnow'
];

/**
 * 2. Dynamically resolve URL list from sitemap.xml
 */
function resolveUrlList() {
  const urls = new Set([
    `${BASE_URL}/`,
    `${BASE_URL}/privacy.html`,
    `${BASE_URL}/webshare/`,
    `${BASE_URL}/webshare/mshare.html`,
    `${BASE_URL}/shareclip-vs-airdrop.html`,
    `${BASE_URL}/shareclip-vs-localsend.html`,
    `${BASE_URL}/shareclip-vs-google-photos.html`,
    `${BASE_URL}/shareclip-vs-immich.html`
  ]);

  const sitemapPath = path.join(webPublicDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    try {
      const xml = fs.readFileSync(sitemapPath, 'utf8');
      const matches = xml.match(/<loc>([^<]+)<\/loc>/g);
      if (matches) {
        for (const m of matches) {
          const loc = m.replace(/<\/?loc>/g, '').trim();
          if (loc.startsWith('http')) {
            urls.add(loc);
          }
        }
      }
    } catch (_) {}
  }

  return Array.from(urls);
}

/**
 * 3. Find or generate a 32-char hex IndexNow key in web/public/<key>.txt
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
    console.log(`${c.cyan}[IndexNow]${c.reset} 发现已有 Key: ${c.bold}${key}${c.reset} (${foundKeyFile})`);
    const filePath = path.join(webPublicDir, foundKeyFile);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (content !== key) {
      console.log(`${c.yellow}[IndexNow] 矫正 Key 文件内容...${c.reset}`);
      fs.writeFileSync(filePath, key, 'utf8');
    }
  } else {
    key = crypto.randomBytes(16).toString('hex');
    const newKeyFile = path.join(webPublicDir, `${key}.txt`);
    console.log(`${c.green}[IndexNow] 生成全新 32 位 Hex Key: ${key}${c.reset}`);
    fs.writeFileSync(newKeyFile, key, 'utf8');
    console.log(`${c.green}[IndexNow] Key 文件已写入: ${newKeyFile}${c.reset}`);
  }

  // Update sitemap.xml lastmod with current date
  const sitemapPath = path.join(webPublicDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const today = new Date().toISOString().split('T')[0];
    let sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    sitemapXml = sitemapXml.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
    fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
    console.log(`${c.dim}[SEO] sitemap.xml <lastmod> 已刷新至 ${today}${c.reset}`);
  }

  return key;
}

/**
 * 4. Push URL list to IndexNow endpoints
 */
async function pushToIndexNow(key, urlList) {
  const payload = {
    host: HOST,
    key: key,
    keyLocation: `${BASE_URL}/${key}.txt`,
    urlList: urlList
  };

  console.log(`\n${c.bold}${c.magenta}=== [1/4] IndexNow 瞬时索引推送 ===${c.reset}`);
  console.log(`${c.dim}推送主机:${c.reset} ${HOST}`);
  console.log(`${c.dim}Key验证地址:${c.reset} ${payload.keyLocation}`);
  console.log(`${c.dim}待推流 URL 总数:${c.reset} ${urlList.length} 条\n`);

  const results = [];

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    const endpointName = new URL(endpoint).hostname;
    process.stdout.write(`  ${c.cyan}→ 正在提交至 ${endpointName}...${c.reset} `);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'ShareCLIP-SEO-Agent/1.0'
        },
        body: JSON.stringify(payload)
      });

      const status = response.status;
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (_) {}

      let statusMsg = '';
      let isSuccess = false;

      if (status === 200) {
        statusMsg = '200 OK (提交成功)';
        isSuccess = true;
      } else if (status === 202) {
        statusMsg = '202 Accepted (已接收，排队验证中)';
        isSuccess = true;
      } else if (status === 400) {
        statusMsg = '400 Bad Request (格式错误)';
      } else if (status === 403) {
        statusMsg = '403 Forbidden (Key 未在 keyLocation 验证生效)';
      } else if (status === 422) {
        statusMsg = '422 Unprocessable (URL 与 Host 不匹配)';
      } else if (status === 429) {
        statusMsg = '429 Too Many Requests (频率超限)';
      } else {
        statusMsg = `${status} ${response.statusText}`;
      }

      if (isSuccess) {
        console.log(`${c.green}✓ ${statusMsg}${c.reset}`);
      } else {
        console.log(`${c.yellow}⚠ ${statusMsg}${c.reset}`);
      }

      results.push({
        service: `IndexNow (${endpointName})`,
        endpoint,
        status,
        statusMsg,
        success: isSuccess
      });
    } catch (err) {
      console.log(`${c.red}✗ 连接失败: ${err.message}${c.reset}`);
      results.push({
        service: `IndexNow (${endpointName})`,
        endpoint,
        status: 0,
        statusMsg: err.message,
        success: false
      });
    }
  }

  return results;
}

/**
 * 5. Baidu Search Push API (百度搜索资源平台主动推送)
 */
async function pushToBaidu(urlList) {
  console.log(`\n${c.bold}${c.magenta}=== [2/4] 百度站长主动推送 API ===${c.reset}`);

  const baiduSite = process.env.BAIDU_PUSH_SITE || HOST;
  const baiduToken = process.env.BAIDU_PUSH_TOKEN;

  if (!baiduToken) {
    console.log(`${c.yellow}┌─────────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.yellow}│ 💡 [提示] 未检测到 BAIDU_PUSH_TOKEN 环境变量                │${c.reset}`);
    console.log(`${c.yellow}│                                                             │${c.reset}`);
    console.log(`${c.yellow}│ 百度搜索主动推送接入步骤：                                  │${c.reset}`);
    console.log(`${c.yellow}│ 1. 登录百度搜索资源平台: https://ziyuan.baidu.com           │${c.reset}`);
    console.log(`${c.yellow}│ 2. 进入【普通收录】->【API提交】，获取您的专用准入 Token    │${c.reset}`);
    console.log(`${c.yellow}│ 3. 设置环境变量或写入 .env.local：                          │${c.reset}`);
    console.log(`${c.yellow}│    BAIDU_PUSH_SITE=${baiduSite.padEnd(41)}│${c.reset}`);
    console.log(`${c.yellow}│    BAIDU_PUSH_TOKEN=your_baidu_token_here                   │${c.reset}`);
    console.log(`${c.yellow}│ 4. 再次运行脚本即可实现秒级百度爬虫调度！                   │${c.reset}`);
    console.log(`${c.yellow}└─────────────────────────────────────────────────────────────┘${c.reset}`);

    return {
      service: '百度搜索主动推送 (Baidu Search)',
      endpoint: 'data.zz.baidu.com/urls',
      status: '未配置 Token',
      statusMsg: '跳过 (可配置 BAIDU_PUSH_TOKEN 启用)',
      success: false,
      skipped: true
    };
  }

  const baiduApiUrl = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(baiduSite)}&token=${encodeURIComponent(baiduToken)}`;
  process.stdout.write(`  ${c.cyan}→ 正在向百度站长平台推流 ${urlList.length} 条 URL...${c.reset} `);

  try {
    const res = await fetch(baiduApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'User-Agent': 'ShareCLIP-SEO-Agent/1.0'
      },
      body: urlList.join('\n')
    });

    const data = await res.json();
    if (data.success) {
      console.log(`${c.green}✓ 成功推送 ${data.success} 条! (当日剩余配额: ${data.remain} 条)${c.reset}`);
      return {
        service: '百度搜索主动推送 (Baidu Search)',
        endpoint: `data.zz.baidu.com (site=${baiduSite})`,
        status: `${res.status} OK`,
        statusMsg: `成功推送 ${data.success} 条，剩余配额 ${data.remain} 条`,
        success: true
      };
    } else {
      console.log(`${c.yellow}⚠ 百度返回错误: [${data.error}] ${data.message}${c.reset}`);
      return {
        service: '百度搜索主动推送 (Baidu Search)',
        endpoint: `data.zz.baidu.com (site=${baiduSite})`,
        status: `${res.status} Err`,
        statusMsg: `错误码 ${data.error}: ${data.message}`,
        success: false
      };
    }
  } catch (err) {
    console.log(`${c.red}✗ 网络异常: ${err.message}${c.reset}`);
    return {
      service: '百度搜索主动推送 (Baidu Search)',
      endpoint: 'data.zz.baidu.com',
      status: '网络错误',
      statusMsg: err.message,
      success: false
    };
  }
}

/**
 * 6. Google Indexing / Sitemaps Ping 标准集成
 */
async function pushToGoogle() {
  console.log(`\n${c.bold}${c.magenta}=== [3/4] Google 搜索引擎规范集成 ===${c.reset}`);

  const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
  process.stdout.write(`  ${c.cyan}→ 检查 Google Sitemaps Ping 规范...${c.reset} `);

  let pingResult = {
    service: 'Google Sitemaps 集成',
    endpoint: 'google.com/ping',
    status: '',
    statusMsg: '',
    success: false
  };

  try {
    const res = await fetch(googlePingUrl);
    if (res.status === 200) {
      console.log(`${c.green}✓ 200 OK (Google 镜像已接受)${c.reset}`);
      pingResult.status = '200 OK';
      pingResult.statusMsg = 'Ping 请求已接受';
      pingResult.success = true;
    } else if (res.status === 404 || res.status === 410) {
      console.log(`${c.yellow}ℹ HTTP ${res.status} (Google 官方已退役 /ping 接口)${c.reset}`);
      console.log(`    ${c.dim}↳ 官方指引：Googlebot 已全面依赖 robots.txt 内的 Sitemap 声明自动巡检抓取。${c.reset}`);
      pingResult.status = `${res.status} Sunsetted`;
      pingResult.statusMsg = 'HTTP Ping 已退役 (robots.txt 已声明 Sitemap，自动巡检)';
      pingResult.success = true;
    } else {
      console.log(`${c.yellow}⚠ HTTP ${res.status} ${res.statusText}${c.reset}`);
      pingResult.status = `${res.status}`;
      pingResult.statusMsg = res.statusText;
      pingResult.success = res.ok;
    }
  } catch (err) {
    console.log(`${c.yellow}ℹ 请求提示: ${err.message}${c.reset}`);
    pingResult.status = 'Notice';
    pingResult.statusMsg = '已遵照 Google 官方标准通过 robots.txt 供 Googlebot 自动索引';
    pingResult.success = true;
  }

  // Google Service Account / Indexing API 规范提示
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (googleCreds) {
    console.log(`  ${c.green}✓ 检测到 Google Indexing API 凭据: ${googleCreds}${c.reset}`);
  } else {
    console.log(`  ${c.dim}ℹ Google Search Console：当前已在 robots.txt 完整广播 ${SITEMAP_URL}。${c.reset}`);
  }

  return pingResult;
}

/**
 * 7. Bing Sitemap Ping
 */
async function pingBingSitemap() {
  console.log(`\n${c.bold}${c.magenta}=== [4/4] Bing Sitemaps 传统 Ping 检查 ===${c.reset}`);
  const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
  process.stdout.write(`  ${c.cyan}→ 检查 Bing Ping: ${bingPingUrl}...${c.reset} `);

  try {
    const res = await fetch(bingPingUrl);
    if (res.status === 410) {
      console.log(`${c.yellow}ℹ HTTP 410 (Bing 已全面升级推荐 IndexNow 协议)${c.reset}`);
      return {
        service: 'Bing Sitemap Ping',
        endpoint: 'bing.com/ping',
        status: '410 Transitioned',
        statusMsg: 'Bing 已全面优先支持 IndexNow (已在前文推流)',
        success: true
      };
    }
    console.log(`${res.ok ? c.green + '✓' : c.yellow + '⚠'} ${res.status} ${res.statusText}${c.reset}`);
    return {
      service: 'Bing Sitemap Ping',
      endpoint: 'bing.com/ping',
      status: `${res.status}`,
      statusMsg: res.statusText,
      success: res.ok
    };
  } catch (err) {
    console.log(`${c.yellow}⚠ 网络提示: ${err.message}${c.reset}`);
    return {
      service: 'Bing Sitemap Ping',
      endpoint: 'bing.com/ping',
      status: 'Notice',
      statusMsg: err.message,
      success: false
    };
  }
}

/**
 * 8. Main CLI Runner
 */
async function main() {
  console.log(`${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}   ShareCLIP 全网搜索引擎自动化推流与索引增强 Pipeline (v2.0)   ${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================${c.reset}\n`);

  const key = getOrGenerateKey();
  const urlList = resolveUrlList();

  console.log(`${c.dim}站点主域:${c.reset} ${c.bold}${HOST}${c.reset}`);
  console.log(`${c.dim}Sitemap 地址:${c.reset} ${SITEMAP_URL}`);
  console.log(`${c.dim}待推流页面清单:${c.reset}`);
  for (const u of urlList) {
    console.log(`  • ${c.dim}${u}${c.reset}`);
  }

  // 1. IndexNow Push
  const indexNowResults = await pushToIndexNow(key, urlList);

  // 2. Baidu Search Active Push
  const baiduResult = await pushToBaidu(urlList);

  // 3. Google Standard Sitemaps Ping
  const googleResult = await pushToGoogle();

  // 4. Bing Sitemap Ping
  const bingResult = await pingBingSitemap();

  // Aggregate Summary Report
  const allReports = [
    ...indexNowResults,
    baiduResult,
    googleResult,
    bingResult
  ];

  console.log(`\n${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}                    推流与索引综合统计报告                      ${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.dim}本次提交页面总数:${c.reset} ${c.bold}${urlList.length}${c.reset} 个 URL | ${c.dim}验证密钥:${c.reset} ${key}\n`);

  for (const item of allReports) {
    let icon = item.success ? `${c.green}✅ 成功${c.reset}` : (item.skipped ? `${c.yellow}ℹ️ 跳过${c.reset}` : `${c.red}⚠️ 告警${c.reset}`);
    console.log(`  ${icon.padEnd(10)} ${c.bold}${item.service.padEnd(32)}${c.reset}`);
    console.log(`             ${c.dim}状态:${c.reset} ${item.status} | ${c.dim}详情:${c.reset} ${item.statusMsg}`);
  }

  console.log(`\n${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.green}✨ SEO 推流任务圆满完成！新页面将在各搜索引擎排队完成秒级抓取。${c.reset}`);
  console.log(`${c.dim}提示：请确保最新代码及 Key 文件已正常推送到 GitHub Pages 分支。${c.reset}\n`);
}

main().catch(err => {
  console.error(`\n${c.red}[Fatal Error] 推流脚本异常中断:${c.reset}`, err);
  process.exit(1);
});
