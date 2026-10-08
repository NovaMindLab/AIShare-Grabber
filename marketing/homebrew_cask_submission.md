# 🍺 Homebrew Cask 官方收录申请规范与 PR 提交指南

> **关于 Homebrew Cask**:
> Homebrew 是 macOS 平台第一包管理器。将 ShareCLIP 收录进官方 [`Homebrew/homebrew-cask`](https://github.com/Homebrew/homebrew-cask) 核心仓库后，全球 Mac 开发者与极客用户只需在终端执行一行命令：
> ```bash
> brew install --cask shareclip
> ```
> 即可自动下载并静默安装 ShareCLIP，支持通过 `brew upgrade --cask` 统一管理版本更新。

---

## 💎 标准 Ruby 描述符文件 (`Casks/s/shareclip.rb`)

以下是完全符合 Homebrew 官方代码规范与 RuboCop 静态检查的标准 Cask 描述符（已适配 Apple Silicon `arm64` 与 Intel `x64` 双架构）：

```ruby
cask "shareclip" do
  arch arm: "arm64", intel: "x64"

  version "4.5.8"
  sha256 arm:   "0e262192d3246809a5eeaaea7fcaee4f99f57314b255eb96a5b2f606f638237c",
         intel: "fcd71197b058ada019b378bb18d16b086020c61213307e4cfed634879c57ceaf"

  url "https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v#{version}/ShareCLIP-Mac-#{version}-#{arch}.dmg",
      verified: "github.com/NovaMindLab/AIShare-Grabber/"
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
```

> 💡 **文件已自动生成**: 该描述符亦由 `scripts/generate-package-manifests.mjs` 每次发版时在 `manifests/homebrew/shareclip.rb` 保持最新哈希同步。

---

## 🚀 官方 Pull Request 提审操作步骤

Homebrew 社区采用严格的自动化 CI 测试（包含 macOS 虚拟机安装、校验与卸载测试）。请按以下标准流程操作：

### 步骤 1：准备本地环境并 Fork 仓库
在 Mac 设备终端中：
```bash
# 确保本地 Homebrew 为最新状态
brew update

# 检出 homebrew-cask 仓库（如未 tap）
brew tap homebrew/cask

# 在 GitHub 网页端 Fork 官方仓库:
# https://github.com/Homebrew/homebrew-cask
```

### 步骤 2：创建本地特性分支并添加描述符
```bash
# 进入 homebrew-cask 本地克隆路径
cd "$(brew --repo homebrew/cask)"

# 切换并同步最新 master 分支
git checkout master
git pull

# 新建分支
git checkout -b add-shareclip-cask

# 按首字母规则，将 shareclip.rb 放置在 Casks/s/ 目录下
mkdir -p Casks/s/
cp /path/to/AIShare-Grabber/manifests/homebrew/shareclip.rb Casks/s/shareclip.rb
```

### 步骤 3：运行官方审计与格式检查（必须 100% 通过）
Homebrew 官方 CI 会严格执行 RuboCop 与审计，提交前必须在本地验证：

```bash
# 1. 运行代码风格检查 (RuboCop)
brew style --cask shareclip

# 2. 运行新 Cask 审计检查
brew audit --cask --new-cask shareclip

# 3. 本地试装验证
brew install --cask ./Casks/s/shareclip.rb

# 4. 验证应用能否启动与正常识别
# 5. 卸载与清理测试 (验证 zap trash)
brew uninstall --cask --zap shareclip
```

### 步骤 4：提交 Commit 并发起 PR
Homebrew 对 Commit 标题有严格的标准正则匹配：
```bash
git add Casks/s/shareclip.rb

# 严格按照 "shareclip <version> (new cask)" 格式编写 Commit 信息
git commit -m "shareclip 4.5.8 (new cask)"

# 推送到个人 Fork 仓库
git push origin add-shareclip-cask
```

然后在 GitHub 上打开 PR：
* **目标仓库 (Base Repository)**: `Homebrew/homebrew-cask:master`
* **头分支 (Head Repository)**: `your-username/homebrew-cask:add-shareclip-cask`
* **PR 标题**: `shareclip 4.5.8 (new cask)`
* **PR 内容**: 勾选 Homebrew 官方模板提供的自检项（已完成 audit, style 与 install 测试）。

---

## ⚡ 官方合并前的自定义 Tap 过渡方案 (Immediate User Access)

在官方 `homebrew/homebrew-cask` PR 审核期间，维护者或用户可通过 NovaMindLab 自建 Tap 立即安装：

```bash
# 1. 一键安装
brew install --cask NovaMindLab/AIShare-Grabber/shareclip

# 或直接指向 RAW 描述符安装：
brew install --cask https://raw.githubusercontent.com/NovaMindLab/AIShare-Grabber/main/manifests/homebrew/shareclip.rb
```

---

## 🔄 后续版本自动升级 (Future Releases)

一旦官方收录合入主分支后，后续版本（如 `v4.5.9`）发布时无需手动提 PR，可直接使用官方自动化工具一键提交：

```bash
brew bump-cask-pr --version=4.5.9 shareclip
```
或在 GitHub Actions 中集成 `Homebrew/actions/bump-formulae` 实现全自动版本迭代升级。
