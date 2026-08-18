<#
.SYNOPSIS
  ShareCLIP Release Packaging Helper with Safe Mixpanel Token Injection
.DESCRIPTION
  Builds Android APK and PC Desktop Client while injecting the private Mixpanel Token.
  The token is read from parameters or uncommitted .env.local and is NEVER saved into git.
#>

param(
    [string]$Token = "",
    [switch]$BuildAndroid,
    [switch]$BuildDesktop
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🚀 ShareCLIP Safe Release Packaging Script" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Resolve Token if not passed as parameter
if ([string]::IsNullOrWhiteSpace($Token)) {
    if (Test-Path "$PSScriptRoot\cp_clip\.env.local") {
        Get-Content "$PSScriptRoot\cp_clip\.env.local" | ForEach-Object {
            if ($_ -match "VITE_MIXPANEL_TOKEN=(.+)") {
                $Token = $matches[1].Trim()
            }
        }
    } elseif (Test-Path "$PSScriptRoot\.env.local") {
        Get-Content "$PSScriptRoot\.env.local" | ForEach-Object {
            if ($_ -match "MIXPANEL_TOKEN=(.+)") {
                $Token = $matches[1].Trim()
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "ℹ️ [Info] No Mixpanel Token detected. Building in pure offline / telemetry-disabled mode." -ForegroundColor Yellow
} else {
    Write-Host "🔒 [Secure] Ingesting Mixpanel Token (Length: $($Token.Length) chars) for release build." -ForegroundColor Green
}

# 2. Build Desktop Client (Electron)
if ($BuildDesktop -or (-not $BuildAndroid)) {
    Write-Host "`n📦 [1/2] Packaging PC Desktop Client..." -ForegroundColor Cyan
    Push-Location "$PSScriptRoot\cp_clip"
    try {
        if (-not [string]::IsNullOrWhiteSpace($Token)) {
            $env:VITE_MIXPANEL_TOKEN = $Token
        }
        npm run build
        npm run dist
        Write-Host "✅ Desktop client packaged successfully into cp_clip/dist_electron/" -ForegroundColor Green
    } finally {
        $env:VITE_MIXPANEL_TOKEN = $null
        Pop-Location
    }
}

# 3. Build Android Mobile Client (APK)
if ($BuildAndroid -or (-not $BuildDesktop)) {
    Write-Host "`n📱 [2/2] Packaging Android APK..." -ForegroundColor Cyan
    Push-Location "$PSScriptRoot\android"
    try {
        if (-not [string]::IsNullOrWhiteSpace($Token)) {
            flutter build apk --release --dart-define=MIXPANEL_TOKEN=$Token
        } else {
            flutter build apk --release
        }
        Write-Host "✅ Android APK packaged successfully into android/build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host "`n🎉 All release builds completed!" -ForegroundColor Green
