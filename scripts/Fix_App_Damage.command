#!/bin/bash
# ==============================================================================
# ShareCLIP macOS Gatekeeper 权限与隔离标记一键修复脚本
# 作用：自动移除 macOS 下载隔离属性 (com.apple.quarantine) 并重签本地 Ad-hoc 签名
# ==============================================================================

clear
echo "=============================================================================="
echo "           🍎 ShareCLIP macOS 打开权限与 Gatekeeper 一键修复向导"
echo "=============================================================================="
echo ""

CANDIDATES=(
    "/Applications/ShareCLIP.app"
    "$HOME/Desktop/ShareCLIP.app"
    "$HOME/Downloads/ShareCLIP.app"
    "$(cd "$(dirname "$0")" && pwd)/ShareCLIP.app"
)

FOUND_APPS=()

for target in "${CANDIDATES[@]}"; do
    if [ -d "$target" ]; then
        FOUND_APPS+=("$target")
    fi
done

if [ ${#FOUND_APPS[@]} -gt 0 ]; then
    echo "正在执行安全策略解锁与属性净化，期间可能需要输入您的 Mac 登录密码（密码输入时不显示）："
    echo ""
    for app in "${FOUND_APPS[@]}"; do
        echo "🔧 正在修复: $app"
        sudo xattr -rd com.apple.quarantine "$app" 2>/dev/null || true
        sudo xattr -cr "$app" 2>/dev/null || true
        sudo codesign --force --deep --sign - "$app" 2>/dev/null || true
        echo "✅ 已完成安全签名与隔离清除: $app"
    done
    echo ""
    echo "=============================================================================="
    echo " [🎉 修复完成] 已成功移除 Gatekeeper 隔离锁定！"
    echo " 现在您可以直接双击打开 ShareCLIP 了。"
    echo "=============================================================================="
else
    echo "⚠️ 自动检测未发现已解压的 ShareCLIP.app。"
    echo "如果您已将 ShareCLIP.app 移动到其他文件夹，请直接将该图标拖拽到本终端窗口中，然后按回车："
    read -r CUSTOM_PATH
    CUSTOM_PATH="${CUSTOM_PATH//\'/}"
    CUSTOM_PATH="${CUSTOM_PATH//\"/}"
    if [ -d "$CUSTOM_PATH" ]; then
        echo "🔧 正在修复: $CUSTOM_PATH"
        sudo xattr -rd com.apple.quarantine "$CUSTOM_PATH" 2>/dev/null || true
        sudo xattr -cr "$CUSTOM_PATH" 2>/dev/null || true
        sudo codesign --force --deep --sign - "$CUSTOM_PATH" 2>/dev/null || true
        echo "🎉 修复完成！现在可以正常打开该应用了。"
    else
        echo "❌ 路径无效，请先将 ShareCLIP 拖拽到「桌面」或「应用程序」文件夹后重试。"
    fi
fi

echo ""
read -p "按回车键退出..."
