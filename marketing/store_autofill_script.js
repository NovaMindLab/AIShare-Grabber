// ==============================================================================
// ShareCLIP - Microsoft Partner Center 一键自动填表辅助脚本 (Console Auto-Fill)
// 适配版本: v4.5.16
// 使用方法：
// 1. 在浏览器登录 https://partner.microsoft.com/dashboard/apps-and-games/overview
// 2. 点击已上架应用 "ShareCLIP" (Store ID: XP8JZTVS6KRX72) -> 点击“更新 (Update)”
// 3. 进入“程序包 (Packages)”或“安装程序设置 (Installer Settings)”页面
// 4. 按键盘 F12 打开开发者工具 -> 切换到 Console (控制台)
// 5. 粘贴本脚本内容并回车，即可查看更新参数或一键填写输入框！
// ==============================================================================

const SHARECLIP_DATA = {
  version: "4.5.16",
  storeId: "XP8JZTVS6KRX72",
  installer: {
    // 推荐加速下载镜像（微软商店拉取测试更稳定）
    downloadUrl: "https://ghfast.top/https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.16/ShareCLIP-Setup-4.5.16.exe",
    // 官方 GitHub 直链备选
    downloadUrlDirect: "https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.16/ShareCLIP-Setup-4.5.16.exe",
    sha256: "7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b",
    silentInstallArgs: "/S",
    silentUninstallCommand: '"%LocalAppData%\\Programs\\ShareCLIP\\Uninstall ShareCLIP.exe" /S',
    version: "4.5.16",
    architecture: "x64"
  },
  releaseNotesZh: [
    "1. 🎬 新增 HTTP 206 Range 零下载毫秒级流式视频在线预览播放器；",
    "2. 🛠️ 修复视频播放器在部分特殊模板渲染下的崩溃问题，大幅提升播放稳定性；",
    "3. 📱 优化局域网设备发现与 IP 解析逻辑，消除跨网段连接偶发无响应；",
    "4. 🔄 修复 Android 端自动更新死循环问题，支持原生版本比对；",
    "5. ⚡ 深度优化 ONNX Runtime 与 MobileCLIP2 内存占用，提升多任务并发流畅度。"
  ].join("\n"),
  releaseNotesEn: [
    "1. 🎬 Added zero-download HTTP 206 Range online video streaming preview player;",
    "2. 🛠️ Fixed video player template render crash and enhanced playback stability;",
    "3. 📱 Enhanced local network IP discovery and robust cross-device pairing;",
    "4. 🔄 Resolved Android auto-updater infinite loop with native version comparison;",
    "5. ⚡ Memory and performance optimizations for on-device AI inference."
  ].join("\n"),
  listingZh: {
    title: "ShareCLIP",
    subtitle: "私有局域网极速互传 AirDrop 替代品，端侧离线 AI 语义搜图与 4K 视频下载工坊",
    keywords: ["AirDrop", "局域网传输", "LocalSend", "AI搜图", "视频下载器", "剪贴板同步", "局域网共享"],
    privacyUrl: "https://novamindlab.github.io/AIShare-Grabber/privacy.html",
    supportUrl: "https://github.com/NovaMindLab/AIShare-Grabber/issues",
    website: "https://novamindlab.github.io/AIShare-Grabber/"
  }
};

console.log("%c🚀 ShareCLIP 微软商店 v4.5.16 快捷提审参数已就绪！", "color: #4f46e5; font-size: 16px; font-weight: bold;");
console.log("【安装包下载 URL (加速源)】:\n", SHARECLIP_DATA.installer.downloadUrl);
console.log("【安装包下载 URL (GitHub直链)】:\n", SHARECLIP_DATA.installer.downloadUrlDirect);
console.log("【安装包 SHA256】:\n", SHARECLIP_DATA.installer.sha256);
console.log("【静默安装参数】:\n", SHARECLIP_DATA.installer.silentInstallArgs);
console.log("【静默卸载命令】:\n", SHARECLIP_DATA.installer.silentUninstallCommand);
console.log("【应用程序版本】:\n", SHARECLIP_DATA.installer.version);
console.log("【v4.5.16 更新日志 (中文)】:\n" + SHARECLIP_DATA.releaseNotesZh);
console.log("【v4.5.16 Release Notes (EN)】:\n" + SHARECLIP_DATA.releaseNotesEn);

// 尝试自动寻找页面输入框填入
function tryAutoFill() {
  const inputs = Array.from(document.querySelectorAll('input, textarea'));
  let matched = 0;
  inputs.forEach(el => {
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    const name = (el.getAttribute('name') || '').toLowerCase();
    const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
    const label = (el.closest('label')?.textContent || '').toLowerCase();
    const text = `${aria} ${name} ${placeholder} ${label}`;

    if (text.includes('download url') || text.includes('installer url') || text.includes('下载 url') || text.includes('安装程序 url')) {
      el.value = SHARECLIP_DATA.installer.downloadUrl;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      matched++;
    } else if (text.includes('version') || text.includes('版本')) {
      if (el.tagName === 'INPUT' && !el.value.includes('.')) {
        el.value = SHARECLIP_DATA.installer.version;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        matched++;
      }
    } else if (text.includes('silent install') || text.includes('静默安装')) {
      el.value = SHARECLIP_DATA.installer.silentInstallArgs;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      matched++;
    }
  });
  console.log(`✨ 自动匹配填入 ${matched} 个字段。请人工核对后点击保存与提交！`);
}

tryAutoFill();
