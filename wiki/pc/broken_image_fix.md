# 本地图片加载修复：协议处理器路径解析

在开发本地相册分类应用时，由于浏览器的安全策略（CSP），前端无法直接通过 `file://` 协议加载本地硬盘上的照片，这会导致所有图片显示为“烂图”（加载失败）。为了安全地加载本地文件，我们设计了自定义的 `local://` 协议处理器，但在 Windows 盘符解析上遇到了重大问题。

---

## 🔍 问题现象与原因分析

### 1. 现象
在 Windows 系统下，选择包含图片的目录后，所有的图片缩略图均显示为破损状态，开发者工具控制台中输出大量的 `local://D:/... 404 (Not Found)` 错误。

### 2. 根源分析
原有的图片 URL 构造方式如下：
```javascript
// 前端 App.vue
src = `local://${filePath.replace(/\\/g, '/')}`
```
若文件路径为 `D:\photo.jpg`，则拼接后的 URL 为 `local://D:/photo.jpg`。

当此 URL 被后端的 `new URL(request.url)` 解析时：
*   由于使用了双斜杠（`local://`），解析器将紧跟在双斜杠后的 `D` 识别为 **`hostname` (主机名)**，而冒号和后面的路径被识别为 `pathname`。
*   在解析过程中，**冒号 `:` 会被吞掉**。
*   后端提取路径时执行：`let filePath = decodeURIComponent(url.hostname + url.pathname);`
*   拼接出的路径变成了 `D/photo.jpg`（**丢失了关键的冒号 `:`**）。
*   由于路径不再是合法的 Windows 绝对路径，`fs.existsSync()` 返回 `false`，最终返回 `404 Not Found`。

---

## 🛠️ 解决方案

为了解决盘符和冒号解析丢失的问题，我们采用了 **“三斜杠 `local:///` 构造法”**。三斜杠可以强迫整个 Windows 盘符与路径都进入 URL 的 `pathname`，使 `hostname` 留空。

### 1. 前端修改 ([App.vue](file:///d:/AI_serach_image/image_clip/src/App.vue))
将图片 URL 的前缀由双斜杠改为三斜杠，确保整个盘符（包括冒号）被安全归类为 `pathname`：
```diff
- src = `local://${filePath.replace(/\\/g, '/')}`;
+ src = `local:///${filePath.replace(/\\/g, '/')}`;
```

### 2. 后端修改 ([main.cjs](file:///d:/AI_serach_image/image_clip/main.cjs))
在 Electron 主进程的 `protocol.handle('local')` 处理器中，直接使用 `url.pathname`，并对 Windows 的盘符前导斜杠（例如 `/D:/photo.jpg`）进行修剪和标准化：
```javascript
protocol.handle('local', (request) => {
  try {
    const url = new URL(request.url);
    // 使用三斜杠后，完整 Windows 路径存放在 url.pathname 中（形如 "/D:/photo.jpg"）
    let filePath = decodeURIComponent(url.pathname);
    
    // 在 Windows 上：如果是 "/D:/photo.jpg"，需要剥离最前面的 "/" 还原为 "D:/photo.jpg"
    if (filePath.startsWith('/') && filePath.length > 2 && filePath[2] === ':') {
      filePath = filePath.slice(1);
    }
    
    // 标准化斜杠以匹配系统风格
    filePath = path.normalize(filePath);

    if (!fs.existsSync(filePath)) {
      console.error(`Protocol local load: File not found: ${filePath}`);
      return new Response("Not found", { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    return new Response(buffer, {
      headers: {
        'content-type': getMimeType(filePath),
        'access-control-allow-origin': '*'
      }
    });
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
});
```

---

## 📈 修复效果

*   **路径解析**：URL `local:///D:/photo.jpg` 会被完美解析为 `url.pathname = "/D:/photo.jpg"`。
*   **盘符还原**：后端检测到 `pathname` 第二个字符是 `:`，剥离前导斜杠还原为 `D:\photo.jpg`，文件系统顺利读取并返回二进制数据。
*   **渲染表现**：本地相册图片全部瞬间秒开，加载零延迟，烂图问题彻底解决！
