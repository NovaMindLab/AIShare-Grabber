#!/bin/bash
# ==============================================================================
# ShareCLIP macOS Gatekeeper 权限与隔离标记一键修复脚本
# 作用：自动移除 macOS 下载隔离属性 (com.apple.quarantine)，解决提示“应用已损坏，移至废纸篓”或无法打开问题
# ==============================================================================

clear
echo "=============================================================================="
echo "           🍎 ShareCLIP macOS 打开权限与 Gatekeeper 一键修复向导"
echo "=============================================================================="
echo ""
echo "正在检测已安装的 ShareCLIP.app..."

TARGET_APP="/Applications/ShareCLIP.app"
DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$TARGET_APP" ] && [ -d "$DIR/ShareCLIP.app" ]; then
    TARGET_APP="$DIR/ShareCLIP.app"
fi

if [ -d "$TARGET_APP" ]; then
    echo "找到应用目标: $TARGET_APP"
    echo "正在执行安全策略解锁与属性净化，期间可能需要输入您的 Mac 登录密码（密码输入时不显示）："
    echo ""
    sudo xattr -rd com.apple.quarantine "$TARGET_APP" 2>/dev/null || true
    sudo xattr -cr "$TARGET_APP" 2>/dev/null || true
    echo ""
    echo "=============================================================================="
    echo " [🎉 修复完成] 已成功移除 Gatekeeper 隔离锁定！"
    echo " 现在您可以直接前往「启动台 (Launchpad)」或「应用程序」双击打开 ShareCLIP。"
    echo "=============================================================================="
else
    echo "⚠️ 未在「应用程序 (/Applications)」目录中找到 ShareCLIP.app！"
    echo "提示：请先将 DMG 安装盘中的 ShareCLIP 图标拖入「应用程序」文件夹，然后再运行本脚本。"
fi

echo ""
read -p "按回车键退出..."
