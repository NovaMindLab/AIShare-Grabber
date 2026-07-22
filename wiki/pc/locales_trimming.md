# Electron-Builder 语言包（Locales）裁剪配置指南

在基于 Electron 构建桌面端应用时，打包体积中往往包含 **30MB ~ 40MB** 的 `locales` 目录（内含 50 多种语言的 `.pak` 文件）。如果应用本身所有的界面翻译都是由前端代码（如 Vue-I18n, React-Intl 或自定义的 JSON 字典）独立渲染，那么除主语言外的 Chromium 底层原生语言包就完全可以被裁撤。

本文详细记录如何在 `electron-builder` 中配置语言包裁剪，以实现极佳的包体积优化。

---

## 🏗️ 1. 核心配置：使用 `electronLanguages`

`electron-builder` 提供了一个官方原生的配置属性 **`electronLanguages`**，用于在打包阶段自动过滤剔除不必要的 Chromium 语言 `.pak` 文件。

### 1.1 `package.json` 配置示例

打开应用根目录下的 `package.json`，在 `"build"` 配置区块的第一级属性中，添加目标语言代码数组即可：

```json
{
  "name": "your-app-name",
  "version": "1.0.0",
  "build": {
    "appId": "com.example.app",
    "productName": "ExampleApp",
    
    // 🔔 核心配置：在此处指定需要保留的 Chromium 语言包
    "electronLanguages": ["zh-CN", "en-US"],
    
    "directories": {
      "output": "dist_electron"
    },
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

### 1.2 常用语言代码参考
数组中的字符串必须与 Chromium 默认生成的 `.pak` 文件名保持精确匹配。以下为常用国家及地区代码：

| 语言代码 | 对应的 `.pak` 文件名 | 适用语言 |
|---|---|---|
| `"zh-CN"` | `zh-CN.pak` | 简体中文 (中国大陆) |
| `"zh-TW"` | `zh-TW.pak` | 繁体中文 (中国台湾) |
| `"en-US"` | `en-US.pak` | 英语 (美国 - 默认兜底语言) |
| `"en-GB"` | `en-GB.pak` | 英语 (英国) |
| `"ja"` | `ja.pak` | 日语 |
| `"ko"` | `ko.pak` | 韩语 |
| `"fr"` | `fr.pak` | 法语 |
| `"de"` | `de.pak` | 德语 |
| `"es"` | `es.pak` | 西班牙语 |

---

## 🛠️ 2. 进阶配置：使用 `afterPack` 构建钩子（硬核裁剪）

有些情况下，如果在旧版本的 `electron-builder` 中官方 `electronLanguages` 配置未生效，或者除了 `locales` 目录外还希望物理删除其他无用组件（如某些调试文件、未包含在 files 中的冗余原生 DLL 等），可以使用 `afterPack` 生命钩子来执行一段自定义脚本进行“硬核强删”。

### 2.1 编写 `afterPack` 脚本

在 PC 客户端目录下创建一个构建脚本，例如 `build-hooks.js`：

```javascript
const fs = require('fs');
const path = require('path');

/**
 * electron-builder 打包后置钩子
 * @param {Object} context 
 */
module.exports = async function (context) {
  const appOutDir = context.appOutDir; // 物理输出目录（如 dist_electron/win-unpacked）
  const localesDir = path.join(appOutDir, 'locales');

  // 定义我们期望物理留存的语言包文件名
  const keepLocales = ['zh-CN.pak', 'en-US.pak'];

  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir);
    console.log(`[*] [afterPack Hook] 正在过滤 locales 文件夹，保留: ${keepLocales.join(', ')}`);
    
    let deletedCount = 0;
    files.forEach(file => {
      if (!keepLocales.includes(file)) {
        try {
          fs.unlinkSync(path.join(localesDir, file));
          deletedCount++;
        } catch (err) {
          console.error(`[!] 无法删除语言包 ${file}:`, err.message);
        }
      }
    });
    console.log(`[+] [afterPack Hook] 过滤完成！成功物理删除 ${deletedCount} 个无用语言包。`);
  }
};
```

### 2.2 在 `package.json` 中配置该钩子

将脚本路径注册到 `build.afterPack` 配置项中：

```json
{
  "build": {
    "appId": "com.example.app",
    "afterPack": "./build-hooks.js"
  }
}
```

---

## 📝 3. 裁剪后的副作用与兜底机制

当移除了其他小语种的 `.pak` 文件后，应用运行时会有如下行为变化：

1.  **系统菜单语言自动回退**：
    如果用户操作系统语言是法语（French），且我们在 `electronLanguages` 中只保留了 `["zh-CN", "en-US"]`，那么 Electron 的原生右键菜单（剪切、复制、粘贴）以及原生选择文件弹窗上的按钮文字，将**自动回退显示为英文（`en-US`）**。
2.  **前端翻译正常渲染**：
    由于前端 Vue / React 业务代码中配置的 `locales.js` 是完全独立控制的，因此软件的主体界面依然会正常根据应用内部的用户偏好设置，高精度显示目标语言（如法语），不受系统底层 `.pak` 被删除的影响。

---

## 🔍 4. 优化效果验证

配置完成后，运行 `npm run dist`。可以通过以下两步验证裁剪是否生效：

1.  **检查未压缩目录**：
    打开输出目录下的 `win-unpacked/locales/`，应该只剩下 `zh-CN.pak` 和 `en-US.pak` 两个文件。
2.  **对比安装包体积**：
    以本应用（ShareCLIP）为例，实施 locales 裁剪后的体积对比：
    - **剪裁前**：`locales` 目录 37.39 MB，打包安装包大小 **163.3 MB**。
    - **剪裁后**：`locales` 目录 0.87 MB，打包安装包大小 **149.2 MB**（**压缩包直接瘦身 14.1 MB**）。
