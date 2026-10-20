// ==============================================================================
// ShareCLIP - FileHorse / Uptodown 一键填表脚本 (Console Auto-Fill)
// 适配版本: v4.5.15
// ==============================================================================

(function() {
  const APP = {
    name: "ShareCLIP",
    version: "4.5.15",
    developerIdentity: "Software Developer (NovaMindLab Team)",
    authorEmail: "support@shareclip.com",
    website: "https://novamindlab.github.io/AIShare-Grabber/",
    padXmlUrl: "https://novamindlab.github.io/AIShare-Grabber/pad.xml",
    iconUrl: "https://novamindlab.github.io/AIShare-Grabber/pc_logo.png",
    screenshotUrl: "https://novamindlab.github.io/AIShare-Grabber/hero_banner.jpg",
    license: "Freeware / Open Source (MIT)",
    downloadUrlWindows: "https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.15/ShareCLIP-Setup-4.5.15.exe",
    sha256Windows: "7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b",
    vtReportWindows: "https://www.virustotal.com/gui/file/7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b",
    subject: "[Program Submission] ShareCLIP v4.5.15 - Free Offline LAN P2P Sync & AI Photo Search"
  };

  const fileHorseSubmissionMessage = `Hello FileHorse Team,

I am writing as the software developer of ShareCLIP to submit our utility for listing on FileHorse.com.

Below is the required program information:
1. Program Name: ${APP.name}
2. Current Version: ${APP.version}
3. Program / Company Website: ${APP.website}
4. Program Installation Direct Download Link: 
   ${APP.downloadUrlWindows}
5. Program License: ${APP.license} (Completely clean, no ads, no bundled software, no telemetry)
6. Program Icon (256x256): ${APP.iconUrl}
7. Program Screenshot: ${APP.screenshotUrl}
8. Description & Main Features:
   ShareCLIP is a lightweight, privacy-first cross-platform utility that enables ultra-fast peer-to-peer wireless file & photo syncing between Android and Windows PC using local Wi-Fi.
   - Gigabit LAN saturation speeds without cords or cloud storage.
   - 100% on-device offline AI semantic photo search (MobileCLIP2/ONNX).
   - Zero telemetry, zero bundled installers.
9. PAD File Link: ${APP.padXmlUrl}
10. VirusTotal Report (0 Detections Clean):
    ${APP.vtReportWindows}

Identity: ${APP.developerIdentity}
Contact Email: ${APP.authorEmail}

We hereby grant Full Stack Technology FZCO the rights to list ShareCLIP, its icon, screenshots, and mirror/link the installer files.

Thank you very much for your time and review!`;

  const host = window.location.hostname;
  const path = window.location.pathname;

  function setVal(selector, val) {
    const el = document.querySelector(selector);
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      console.log("%c✅ 已自动填写: " + selector, "color: #10b981; font-weight: bold;");
      return true;
    }
    return false;
  }

  // A. FileHorse 针对性处理
  if (host.includes("filehorse.com")) {
    // 如果用户在 /submit/ 页面（这是规则说明页，没有表单）
    if (!path.includes("/contact")) {
      console.warn("⚠️ 检测到您当前在 FileHorse 的规则说明页 (无输入框)。");
      console.log("%c👉 真正的提交表单在: https://www.filehorse.com/contact/", "color: #ef4444; font-size: 16px; font-weight: bold;");
      if (confirm("当前页面是 FileHorse 的规范说明页（无表单）。\n是否立即跳转到真实的提交表单页面 (https://www.filehorse.com/contact/)？")) {
        window.location.href = "https://www.filehorse.com/contact/";
        return;
      }
    } else {
      // 在 /contact/ 表单页，直接自动填写全部 4 个输入框！
      console.log("%c正在自动填写 FileHorse 联络/提交表单...", "color: #3b82f6; font-weight: bold;");
      setVal("input[name='name']", "NovaMindLab (ShareCLIP Team)");
      setVal("input[name='email']", APP.authorEmail);
      setVal("input[name='subject']", APP.subject);
      setVal("textarea[name='message']", fileHorseSubmissionMessage);

      // 滚动到底部让用户方便看验证码和提交按钮
      const submitBtn = document.querySelector("#submitter, input[type='submit']");
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        console.log("%c🎉 表单填写完成！请在页面下方勾选【人机身份验证 (reCAPTCHA)】，然后点击【Send message】提交！", "color: #10b981; font-size: 15px; font-weight: bold;");
      }
      return;
    }
  }

  // 备用输出
  console.log("%c📋 【ShareCLIP 提交物料信息】", "color: #6366f1; font-weight: bold;");
  console.log(fileHorseSubmissionMessage);
})();
