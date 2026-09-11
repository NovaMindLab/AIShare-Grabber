@echo off
chcp 65001 >nul
:: ==============================================================================
:: ShareCLIP Windows 开源受信任代码签名证书一键安装脚本
:: 作用：将 ShareCLIP 公钥证书导入 Windows 本地受信任根证书与受信发布者存储库，消除 SmartScreen 阻断警告
:: ==============================================================================
title ShareCLIP 证书导入工具

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 正在请求管理员权限以将证书安全导入至系统受信存储区...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
set "CERT_FILE=ShareCLIP-CodeSign.cer"

if not exist "%CERT_FILE%" (
    echo [错误] 未在当前目录下找到 %CERT_FILE% 证书文件！
    echo 请确保本批处理脚本与 %CERT_FILE% 位于同一目录。
    pause
    exit /b 1
)

echo.
echo ==============================================================================
echo   正在安装 ShareCLIP 开源数字证书...
echo ==============================================================================
echo.

certutil -addstore -f "ROOT" "%CERT_FILE%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [1/2] 成功将证书安装至「受信任的根证书颁发机构 (ROOT)」！
) else (
    echo [警告] 导入 ROOT 存储库返回码: %errorLevel%
)

certutil -addstore -f "TrustedPublisher" "%CERT_FILE%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [2/2] 成功将证书安装至「受信任的发布者 (TrustedPublisher)」！
) else (
    echo [警告] 导入 TrustedPublisher 存储库返回码: %errorLevel%
)

echo.
echo ==============================================================================
echo [完成] ShareCLIP 证书信任安装已就绪！
echo 现在您可以直接双击运行 ShareCLIP 安装程序，不再受 Windows SmartScreen 拦截。
echo ==============================================================================
echo.
pause
