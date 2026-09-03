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
    [switch]$BuildDesktop,
    [switch]$NoBump,
    [string]$TargetVersion = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🚀 ShareCLIP Safe Release Packaging Script" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Ensure Flutter is in PATH
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    if (Test-Path "D:\soft\flutter\bin") {
        $env:PATH = "D:\soft\flutter\bin;$env:PATH"
    }
}

# 1. Auto Version Increment (Version++)
if (-not $NoBump) {
    $pcPkg = "$PSScriptRoot\cp_clip\package.json"
    $webPkg = "$PSScriptRoot\web\package.json"
    $pubspec = "$PSScriptRoot\android\pubspec.yaml"
    $mainDart = "$PSScriptRoot\android\lib\main.dart"

    $curContent = Get-Content $pcPkg -Raw
    if ($curContent -match '"version":\s*"(\d+)\.(\d+)\.(\d+)"') {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        $patch = [int]$matches[3]
        $curVersion = "$major.$minor.$patch"
        
        if ([string]::IsNullOrWhiteSpace($TargetVersion)) {
            $newPatch = $patch + 1
            $newVersion = "$major.$minor.$newPatch"
        } else {
            $newVersion = $TargetVersion
            if ($newVersion -match '^(\d+)\.(\d+)\.(\d+)$') {
                $major = [int]$matches[1]
                $minor = [int]$matches[2]
                $newPatch = [int]$matches[3]
            }
        }
        
        $newVersionCode = $major * 10000 + $minor * 100 + $newPatch

        Write-Host "⬆️ [Version++] Automatically bumping version: $curVersion -> $newVersion (Code: $newVersionCode)" -ForegroundColor Green

        # Update cp_clip/package.json
        (Get-Content $pcPkg -Raw) -replace '"version":\s*"[0-9.]+"', "`"version`": `"$newVersion`"" | Set-Content $pcPkg -NoNewline

        # Update web/package.json
        if (Test-Path $webPkg) {
            (Get-Content $webPkg -Raw) -replace '"version":\s*"[0-9.]+"', "`"version`": `"$newVersion`"" | Set-Content $webPkg -NoNewline
        }

        # Update android/pubspec.yaml
        if (Test-Path $pubspec) {
            (Get-Content $pubspec -Raw) -replace 'version:\s*[0-9.+]+', "version: $newVersion+$newVersionCode" | Set-Content $pubspec -NoNewline
        }

        # Update android/lib/main.dart
        if (Test-Path $mainDart) {
            (Get-Content $mainDart -Raw) -replace "const String appVersion = '[0-9.]+';", "const String appVersion = '$newVersion';" | Set-Content $mainDart -NoNewline
        }
    }
} else {
    Write-Host "ℹ️ [Version] Version bump skipped (-NoBump passed)." -ForegroundColor Yellow
}

# 2. Resolve Token if not passed as parameter
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

# 3. Build Desktop Client (Electron)
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

# 4. Build Android Mobile Client (APK)
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
