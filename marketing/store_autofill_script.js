// ==============================================================================
// ShareCLIP - Microsoft Partner Center 一键自动填表辅助脚本 (Console Auto-Fill)
// 使用方法：
// 1. 在浏览器登录 https://partner.microsoft.com/dashboard/apps-and-games/overview
// 2. 创建 Win32 应用后，进入安装包或商店信息填写页面
// 3. 按键盘 F12 打开开发者工具 -> 切换到 Console (控制台)
// 4. 将本脚本内容粘贴进去并回车，即可瞬间复制全部核心字段或一键填入输入框！
// ==============================================================================

const SHARECLIP_DATA = {
  installer: {
    downloadUrl: "https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.8/ShareCLIP-Setup-4.5.8.exe",
    silentInstallArgs: "/S",
    silentUninstallCommand: '"%LocalAppData%\\Programs\\ShareCLIP\\Uninstall ShareCLIP.exe" /S',
    version: "4.5.8",
    architecture: "x64"
  },
  listingZh: {
    title: "ShareCLIP",
    subtitle: "私有局域网极速互传 AirDrop 替代品，端侧离线 AI 语义搜图与 4K 视频下载工坊",
    keywords: ["AirDrop", "局域网传输", "LocalSend", "AI搜图", "视频下载器", "剪贴板同步", "局域网共享"],
    privacyUrl: "https://novamindlab.github.io/AIShare-Grabber/privacy.html",
    supportUrl: "https://github.com/NovaMindLab/AIShare-Grabber/issues",
    website: "https://novamindlab.github.io/AIShare-Grabber/"
  }
};

console.log("%c🚀 ShareCLIP 微软商店快捷提审助手已就绪！", "color: #4f46e5; font-size: 16px; font-weight: bold;");
console.log("核心参数速查：", SHARECLIP_DATA);
