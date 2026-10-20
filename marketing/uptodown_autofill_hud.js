// ==============================================================================
// ShareCLIP - Uptodown 开发者控制台半自动化辅助脚本 (Console Auto-Fill & HUD)
// 适配平台: https://developers.uptodown.com/
// 适配版本: v4.5.15
// ==============================================================================

(function() {
  const APP = {
    name: "ShareCLIP",
    version: "4.5.15",
    orgName: "NovaMindLab",
    authorEmail: "support@shareclip.com",
    website: "https://novamindlab.github.io/AIShare-Grabber/",
    padXmlUrl: "https://novamindlab.github.io/AIShare-Grabber/pad.xml",
    iconUrl: "https://novamindlab.github.io/AIShare-Grabber/pc_logo.png",
    screenshotUrl: "https://novamindlab.github.io/AIShare-Grabber/hero_banner.jpg",
    license: "Freeware / Open Source",
    category: "Tools / Utilities / Communication",
    downloadUrlWindows: "https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.15/ShareCLIP-Setup-4.5.15.exe",
    downloadUrlAndroid: "https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.15/ShareCLIP-Android-4.5.15.apk",
    sha256Windows: "7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b",
    sha256Android: "b02aa43e85b49efac67176657ee173afcb7f8bcc88197fc3e2122ae7a6ab48bb",
    shortDescEn: "Private P2P LAN wireless file sync & 100% on-device offline AI photo search.",
    fullDescEn: `ShareCLIP is a privacy-first, cross-platform utility designed to replace cloud file transfers with instant gigabit local Wi-Fi P2P syncing.

Key Features:
- 🚀 Ultra-Fast LAN P2P Sync: Transfer high-resolution photos, 4K videos, and large archives directly between Android phones and Windows PCs at local network saturation speeds.
- 🔒 100% Offline & Privacy-First: No cloud servers, no intermediate relay nodes, and no telemetry. Your photos and personal data never leave your local devices.
- 🧠 On-Device Local AI Photo Search: Powered by embedded lightweight vision-language models (MobileCLIP2/ONNX). Search your photo gallery using everyday natural language completely offline.
- 🎬 Zero-Download Streaming Preview: Built-in HTTP 206 Range video streaming engine allows immediate previewing of remote videos without waiting for full download completion.
- ⚡ 100% Free & Clean: No ads, no bundled software, no forced account registration, no subscription paywalls.`,
    descEs: `ShareCLIP es una utilidad multiplataforma privada y ultrarrápida para transferir fotos y archivos a través de Wi-Fi local P2P sin nube ni cables, con búsqueda inteligente de fotos mediante IA local 100% sin conexión.`,
    descFr: `ShareCLIP est un utilitaire multiplateforme privé et ultra-rapide pour synchroniser des fichiers et des photos via Wi-Fi local P2P sans cloud ni câbles, avec recherche de photos par IA 100% locale hors ligne.`,
    changelog: `1. Added zero-download HTTP 206 Range online video streaming preview player;
2. Enhanced local network IP discovery and robust cross-device pairing;
3. Memory and performance optimizations for on-device AI inference.`
  };

  // 1. 深度设置输入框（兼容 React / Angular 响应式绑定）
  function setReactInputValue(input, value) {
    if (!input) return false;
    try {
      const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    } catch (e) {
      input.value = value;
      return true;
    }
  }

  // 2. 智能表单识别与自动填充
  function autoFillUptodownPage() {
    let filledCount = 0;
    const inputs = Array.from(document.querySelectorAll("input, textarea"));

    inputs.forEach(el => {
      const ph = (el.placeholder || "").toLowerCase();
      const name = (el.name || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      const key = `${ph} ${name} ${id} ${aria}`;

      // 注册页面：组织名称
      if (key.includes("organization") || key.includes("company") || key.includes("developer name") || key.includes("brand")) {
        setReactInputValue(el, APP.orgName);
        filledCount++;
      }
      // 应用名称
      else if ((key.includes("app name") || key.includes("name") || key.includes("title")) && !key.includes("user")) {
        setReactInputValue(el, APP.name);
        filledCount++;
      }
      // 官方网址
      else if (key.includes("website") || key.includes("web") || key.includes("url") && !key.includes("download")) {
        setReactInputValue(el, APP.website);
        filledCount++;
      }
      // 描述 / Description
      else if (el.tagName === "TEXTAREA" || key.includes("description") || key.includes("about") || key.includes("details")) {
        setReactInputValue(el, APP.fullDescEn);
        filledCount++;
      }
      // 更新日志 / Changelog
      else if (key.includes("changelog") || key.includes("whats new") || key.includes("recent")) {
        setReactInputValue(el, APP.changelog);
        filledCount++;
      }
      // 邮箱
      else if (key.includes("email") || key.includes("contact")) {
        if (!el.value) {
          setReactInputValue(el, APP.authorEmail);
          filledCount++;
        }
      }
    });

    console.log(`%c✅ [ShareCLIP] 自动匹配填充完成，已填写 ${filledCount} 个字段！`, "color: #10b981; font-weight: bold; font-size: 15px;");
  }

  // 3. 在页面注入悬浮操作控制台 (Floating HUD)
  function injectFloatingHUD() {
    if (document.getElementById("shareclip-uptodown-hud")) return;

    const hud = document.createElement("div");
    hud.id = "shareclip-uptodown-hud";
    hud.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 330px;
      background: #1e1e2f;
      color: #ffffff;
      border: 1px solid #4f46e5;
      border-radius: 12px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.45);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      padding: 16px;
      box-sizing: border-box;
    `;

    hud.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #33334d; padding-bottom:8px;">
        <span style="font-weight:bold; color:#818cf8; font-size:14px;">⚡ ShareCLIP 上架辅助台</span>
        <button id="sc-close-btn" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:16px;">✕</button>
      </div>

      <button id="sc-autofill-btn" style="width:100%; background:#4f46e5; color:white; border:none; border-radius:8px; padding:9px 12px; font-weight:bold; cursor:pointer; margin-bottom:10px; display:flex; justify-content:center; align-items:center; gap:6px;">
        <span>🪄</span> 一键自动填写当前页面
      </button>

      <div style="font-size:11px; color:#9ca3af; margin-bottom:8px; font-weight:600;">一键复制常用参数：</div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:10px;">
        <button class="sc-copy-btn" data-copy="${APP.downloadUrlWindows}" style="background:#2d2d44; color:#e2e8f0; border:1px solid #3f3f5a; border-radius:6px; padding:6px; font-size:11px; cursor:pointer;">📦 Win直链</button>
        <button class="sc-copy-btn" data-copy="${APP.downloadUrlAndroid}" style="background:#2d2d44; color:#e2e8f0; border:1px solid #3f3f5a; border-radius:6px; padding:6px; font-size:11px; cursor:pointer;">📱 APK直链</button>
        <button class="sc-copy-btn" data-copy="${APP.website}" style="background:#2d2d44; color:#e2e8f0; border:1px solid #3f3f5a; border-radius:6px; padding:6px; font-size:11px; cursor:pointer;">🌐 官方网址</button>
        <button class="sc-copy-btn" data-copy="${APP.orgName}" style="background:#2d2d44; color:#e2e8f0; border:1px solid #3f3f5a; border-radius:6px; padding:6px; font-size:11px; cursor:pointer;">🏢 组织名称</button>
      </div>

      <button class="sc-copy-btn" data-copy="${APP.fullDescEn.replace(/"/g, '&quot;')}" style="width:100%; background:#2d2d44; color:#e2e8f0; border:1px solid #3f3f5a; border-radius:6px; padding:6px; font-size:11px; cursor:pointer; margin-bottom:6px;">
        📋 复制完整英文描述 (Markdown)
      </button>

      <div style="font-size:11px; color:#6b7280; text-align:center; margin-top:8px;">
        提示：若遇到新弹窗，点击“一键自动填写”即可
      </div>
    `;

    document.body.appendChild(hud);

    // 绑定事件
    document.getElementById("sc-close-btn").onclick = () => hud.remove();
    document.getElementById("sc-autofill-btn").onclick = () => {
      autoFillUptodownPage();
      const btn = document.getElementById("sc-autofill-btn");
      btn.innerHTML = "<span>✅</span> 填写完成！";
      setTimeout(() => { btn.innerHTML = "<span>🪄</span> 一键自动填写当前页面"; }, 1500);
    };

    hud.querySelectorAll(".sc-copy-btn").forEach(btn => {
      btn.onclick = () => {
        const text = btn.getAttribute("data-copy");
        navigator.clipboard.writeText(text).then(() => {
          const original = btn.innerText;
          btn.innerText = "已复制 ✓";
          btn.style.color = "#10b981";
          setTimeout(() => {
            btn.innerText = original;
            btn.style.color = "#e2e8f0";
          }, 1200);
        });
      };
    });
  }

  // 执行
  injectFloatingHUD();
  autoFillUptodownPage();
  console.log("%c🚀 [ShareCLIP] Uptodown 辅助控制台已挂载在页面右下角！", "color: #4f46e5; font-size: 16px; font-weight: bold;");
})();
