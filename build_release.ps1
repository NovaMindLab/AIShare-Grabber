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
    [string]$TargetVersion = "",
    [switch]$Publish,
    [string]$Repo = "NovaMindLab/AIShare-Grabber"
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
            flutter build apk --release --no-tree-shake-icons --dart-define=MIXPANEL_TOKEN=$Token
        } else {
            flutter build apk --release --no-tree-shake-icons
        }
        Write-Host "✅ Android APK packaged successfully into android/build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host "`n🎉 All release builds completed!" -ForegroundColor Green

# 5. Optional: Publish to GitHub Release
if ($Publish) {
    Write-Host "`n🚀 [3/3] Publishing Release to GitHub ($Repo)..." -ForegroundColor Cyan
    $tag = "v$newVersion"
    
    # 5a. Git commit & push
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Host "Committing release updates to Git..." -ForegroundColor Yellow
        git add .
        git commit -m "chore: bump version to $newVersion & release"
        Write-Host "Pushing updates to origin (master) and github (main)..." -ForegroundColor Yellow
        git push origin master
        git push github master:main
        
        Write-Host "Creating & pushing tag $tag..." -ForegroundColor Yellow
        git tag -a $tag -m "Release $tag" -f
        git push github $tag --force
    }

    # 5b. Collect Assets to upload
    $namedApk = "$PSScriptRoot\android\build\app\outputs\flutter-apk\ShareCLIP-Android-$newVersion.apk"
    $rawApk = "$PSScriptRoot\android\build\app\outputs\flutter-apk\app-release.apk"
    if (Test-Path $rawApk) {
        Copy-Item $rawApk $namedApk -Force
    }

    $assets = @()
    if (Test-Path $namedApk) { $assets += $namedApk }
    
    $pcExe = "$PSScriptRoot\cp_clip\dist_electron\ShareCLIP-Setup-$newVersion.exe"
    if (Test-Path $pcExe) { $assets += $pcExe }

    $pcBlockmap = "$PSScriptRoot\cp_clip\dist_electron\ShareCLIP-Setup-$newVersion.exe.blockmap"
    if (Test-Path $pcBlockmap) { $assets += $pcBlockmap }

    $latestYml = "$PSScriptRoot\cp_clip\dist_electron\latest.yml"
    if (Test-Path $latestYml) { $assets += $latestYml }

    # 5c. GitHub Release via gh CLI
    $ghCmd = "gh"
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        $StandardPaths = @(
            "C:\Program Files\GitHub CLI\gh.exe",
            "C:\Users\houqi\AppData\Local\Programs\GitHub CLI\gh.exe",
            "$env:LocalAppData\Programs\GitHub CLI\gh.exe"
        )
        foreach ($p in $StandardPaths) {
            if (Test-Path $p) { $ghCmd = $p; break }
        }
    }

    $releaseNotes = "### ShareCLIP $tag Release`n`n- 📡 **WebRTC Connection Decoupled & Stabilized**: Completely isolated WebRTC/UDP/HTTP networking into standalone ConnectionManager service; added MTU-safe UDP Answer SDP chunking (800B) preventing router drops.`n- 📱 **Mobile Connection State Machine Hardening**: Strictly awaits PC handshake ACK packet (-4) before transitioning to connected console, preventing premature false connections.`n- ⚡ **AI Classification Engine Optimization**: Massive speedup on dual/quad-core CPUs (i3/i5 U-series); zero GC allocation buffer pooling and CPU AVX2 multi-threading.`n- 📦 **Dual-Platform Builds**: Pre-built Android Universal APK and Windows PC Installer."
    
    Write-Host "Creating GitHub Release with assets:" -ForegroundColor Gray
    foreach ($a in $assets) {
        Write-Host "  - $a" -ForegroundColor Gray
    }

    & $ghCmd release create $tag $assets --title "ShareCLIP $tag" --notes $releaseNotes --repo $Repo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 Successfully published $tag to https://github.com/$Repo/releases/tag/$tag" -ForegroundColor Green
    } else {
        Write-Error "GitHub release creation failed! Please check gh auth."
    }
}
