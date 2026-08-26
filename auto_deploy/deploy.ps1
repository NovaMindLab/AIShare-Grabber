# ShareCLIP Automatic Build & GitHub Deploy Script
# Make sure to run this script from the project root directory.
# Prerequisites:
# 1. GitHub CLI (gh) installed and authenticated: run 'gh auth login'
# 2. Git CLI installed
# 3. Flutter SDK installed
# 4. Node.js & npm installed

param (
    [string]$Tag = "",
    [string]$Repo = "NovaMindLab/AIShare-Grabber",
    [switch]$AutoIncrement = $true
)

$PkgJsonPath = "cp_clip/package.json"
$WebPkgPath = "web/package.json"
$WebSharePkgPath = "webshare/package.json"
$PubspecPath = "android/pubspec.yaml"

if ([string]::IsNullOrEmpty($Tag)) {
    if ($AutoIncrement -and (Test-Path $PkgJsonPath)) {
        # Read current version from package.json
        $CurrentVersion = (Get-Content $PkgJsonPath -Raw | ConvertFrom-Json).version
        # Parse major.minor.patch
        if ($CurrentVersion -match "^(\d+)\.(\d+)\.(\d+)$") {
            $Major = [int]$Matches[1]
            $Minor = [int]$Matches[2]
            $Patch = [int]$Matches[3]
            $NewPatch = $Patch + 1
            $NewVersion = "$Major.$Minor.$NewPatch"
            $Tag = "v$NewVersion"
            Write-Host "Auto-incrementing version: $CurrentVersion -> $NewVersion" -ForegroundColor Green
        } else {
            $Tag = "v" + (Get-Date -Format "yyyy.MM.dd-HHmm")
            Write-Host "Current version format not matched. Generating date-based tag: $Tag" -ForegroundColor Yellow
        }
    } else {
        $Tag = "v" + (Get-Date -Format "yyyy.MM.dd-HHmm")
        Write-Host "No tag specified. Generating automatic tag: $Tag" -ForegroundColor Yellow
    }
}

# 🔍 Locate Flutter and GitHub CLI executables
$FlutterCmd = "flutter"
if (-not (Get-Command "flutter" -ErrorAction SilentlyContinue)) {
    $FlutterPath = "D:\soft\flutter\bin\flutter.bat"
    if (Test-Path $FlutterPath) {
        $FlutterCmd = "$FlutterPath"
    }
}

$GhCmd = "gh"
if (-not (Get-Command "gh" -ErrorAction SilentlyContinue)) {
    $StandardPaths = @(
        "C:\Program Files\GitHub CLI\gh.exe",
        "C:\Users\houqi\AppData\Local\Programs\GitHub CLI\gh.exe",
        "$env:LocalAppData\Programs\GitHub CLI\gh.exe"
    )
    foreach ($Path in $StandardPaths) {
        if (Test-Path $Path) {
            $GhCmd = $Path
            break
        }
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Auto-Deployment for ShareCLIP ($Tag)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Using Flutter path: $FlutterCmd" -ForegroundColor Gray
Write-Host "Using GitHub CLI path: $GhCmd" -ForegroundColor Gray

Write-Host "Closing any running instances of ShareCLIP/Electron to avoid file locks..." -ForegroundColor Yellow
Stop-Process -Name "ShareCLIP" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 0. Sync version number across all platforms
$VersionOnly = $Tag
if ($VersionOnly.StartsWith("v")) {
    $VersionOnly = $VersionOnly.Substring(1)
}

if (Test-Path $PkgJsonPath) {
    Write-Host "Updating version in $PkgJsonPath to $VersionOnly" -ForegroundColor Gray
    $PkgJson = Get-Content $PkgJsonPath -Raw -Encoding utf8 | ConvertFrom-Json
    $PkgJson.version = $VersionOnly
    [System.IO.File]::WriteAllText((Resolve-Path $PkgJsonPath), ($PkgJson | ConvertTo-Json -Depth 10))
}

if (Test-Path $WebPkgPath) {
    Write-Host "Updating version in $WebPkgPath to $VersionOnly" -ForegroundColor Gray
    $WebPkg = Get-Content $WebPkgPath -Raw -Encoding utf8 | ConvertFrom-Json
    $WebPkg.version = $VersionOnly
    [System.IO.File]::WriteAllText((Resolve-Path $WebPkgPath), ($WebPkg | ConvertTo-Json -Depth 10))
}

if (Test-Path $WebSharePkgPath) {
    Write-Host "Updating version in $WebSharePkgPath to $VersionOnly" -ForegroundColor Gray
    $WebSharePkg = Get-Content $WebSharePkgPath -Raw -Encoding utf8 | ConvertFrom-Json
    $WebSharePkg.version = $VersionOnly
    [System.IO.File]::WriteAllText((Resolve-Path $WebSharePkgPath), ($WebSharePkg | ConvertTo-Json -Depth 10))
}

$CalcBuildNumber = 100
if ($VersionOnly -match "\.(\d+)$") {
    $CalcBuildNumber = 100 + [int]$Matches[1]
}

if (Test-Path $PubspecPath) {
    Write-Host "Updating version in $PubspecPath to $VersionOnly+$CalcBuildNumber" -ForegroundColor Gray
    $PubspecContent = Get-Content $PubspecPath -Raw -Encoding utf8
    $PubspecContent = $PubspecContent -replace "(?m)^version:\s+.*", "version: $VersionOnly+$CalcBuildNumber"
    [System.IO.File]::WriteAllText((Resolve-Path $PubspecPath), $PubspecContent)
}

$AndroidMainDart = "android/lib/main.dart"
if (Test-Path $AndroidMainDart) {
    Write-Host "Updating version in $AndroidMainDart to $VersionOnly" -ForegroundColor Gray
    $DartContent = Get-Content $AndroidMainDart -Raw -Encoding utf8
    $DartContent = $DartContent -replace "const String appVersion = '.*';", "const String appVersion = '$VersionOnly';"
    [System.IO.File]::WriteAllText((Resolve-Path $AndroidMainDart), $DartContent)
}

# Commit and push version bump to git repositories
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    $Diff = git status --porcelain
    if ($Diff) {
        Write-Host "Committing updates to Git..." -ForegroundColor Yellow
        git add .
        git commit -m "feat: release $VersionOnly - Full mobile-to-PC music synchronization, multi-folder audio scanning, on-demand batch download, timeline grouping, and player"
        Write-Host "Pushing updates to Gitee (origin) and GitHub (github)..." -ForegroundColor Yellow
        git push origin master
        git push github master:main
    }
}

# 1. Clean and build Web site (web/dist) & WebShare (webshare/dist)
Write-Host "`n📁 Step 1: Building Static Website and WebShare App..." -ForegroundColor Green
$ProjName = $Repo.Split('/')[1]

# 1a. Build WebShare
Write-Host "🔨 Building WebShare App..." -ForegroundColor Cyan
Set-Location "webshare"
npm install
npx vite build --base=/$ProjName/webshare/
if ($LASTEXITCODE -ne 0) {
    Write-Error "WebShare build failed!"
    exit 1
}
Set-Location ".."

# 1b. Build Official Website
Write-Host "🔨 Building Official Website..." -ForegroundColor Cyan
Set-Location "web"
npm install
npx vite build --base=/$ProjName/
if ($LASTEXITCODE -ne 0) {
    Write-Error "Web page build failed!"
    exit 1
}
Set-Location ".."

# 1c. Merge WebShare into web/dist/webshare
Write-Host "📦 Merging WebShare into web/dist/webshare..." -ForegroundColor Cyan
if (Test-Path "web/dist") {
    $WebShareTarget = "web/dist/webshare"
    if (-not (Test-Path $WebShareTarget)) {
        New-Item -ItemType Directory -Path $WebShareTarget -Force | Out-Null
    }
    Copy-Item -Path "webshare/dist/*" -Destination $WebShareTarget -Recurse -Force
}

# Resolve local Mixpanel token if available
$MixpanelToken = ""
if (Test-Path "cp_clip/.env.local") {
    Get-Content "cp_clip/.env.local" | ForEach-Object {
        if ($_ -match "VITE_MIXPANEL_TOKEN=(.+)") {
            $MixpanelToken = $matches[1].Trim()
        }
    }
} elseif (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "MIXPANEL_TOKEN=(.+)") {
            $MixpanelToken = $matches[1].Trim()
        }
    }
}

# 2. Build Electron Desktop Application
Write-Host "`n📁 Step 2: Packaging Electron App..." -ForegroundColor Green
Set-Location "cp_clip"
npm install
if (-not [string]::IsNullOrWhiteSpace($MixpanelToken)) {
    $env:VITE_MIXPANEL_TOKEN = $MixpanelToken
    Write-Host "🔒 Injected Mixpanel Token into Desktop build" -ForegroundColor Gray
}
npm run build
npm run dist
$env:VITE_MIXPANEL_TOKEN = $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Electron packaging failed!"
    exit 1
}
Set-Location ".."

# 3. Build Android Mobile APK
Write-Host "`n📁 Step 3: Compiling Android APK..." -ForegroundColor Green
$CalcBuildNumber = 100
if ($VersionOnly -match "\.(\d+)$") {
    $CalcBuildNumber = 100 + [int]$Matches[1]
}
Set-Location "android"
# Clean previous APK outputs
Remove-Item -Path "build/app/outputs/flutter-apk/*.apk" -Force -ErrorAction SilentlyContinue

if (-not [string]::IsNullOrWhiteSpace($MixpanelToken)) {
    Write-Host "🔒 Injected Mixpanel Token into Android build" -ForegroundColor Gray
    & $FlutterCmd build apk --release --target-platform android-arm64 --build-name $VersionOnly --build-number $CalcBuildNumber --no-tree-shake-icons --dart-define=MIXPANEL_TOKEN=$MixpanelToken
} else {
    & $FlutterCmd build apk --release --target-platform android-arm64 --build-name $VersionOnly --build-number $CalcBuildNumber --no-tree-shake-icons
}
if ($LASTEXITCODE -ne 0) {
    Write-Error "Android compilation failed!"
    exit 1
}

# Rename output APK for crystal-clear Release naming (e.g. ShareCLIP-Android-1.2.87.apk)
$RawApk = "build/app/outputs/flutter-apk/app-release.apk"
$NamedApk = "build/app/outputs/flutter-apk/ShareCLIP-Android-$VersionOnly.apk"
if (Test-Path $RawApk) {
    Copy-Item $RawApk $NamedApk -Force
}
Set-Location ".."

# 4. Copy Web page to a deployment folder and publish to GitHub Pages
Write-Host "`n📁 Step 4: Deploying Website to GitHub Pages..." -ForegroundColor Green
$WebDist = "web/dist"
if (Test-Path $WebDist) {
    # Initialize a temporary git repo inside web dist to push to gh-pages
    Set-Location $WebDist
    git init
    git checkout -B gh-pages
    git add .
    git commit -m "Deploy website for $Tag"
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$Repo.git"
    git push origin gh-pages --force
    Set-Location "../.."
    Write-Host "Website deployed to GitHub Pages successfully!" -ForegroundColor Cyan
} else {
    Write-Warning "Web dist folder not found!"
}

# 5. Create GitHub Release and Upload Assets
Write-Host "`n📁 Step 5: Creating GitHub Release & Uploading Artifacts..." -ForegroundColor Green

# Find builds - strictly match current version
$TargetApkPath = "android/build/app/outputs/flutter-apk/ShareCLIP-Android-$VersionOnly.apk"
if (-not (Test-Path $TargetApkPath)) {
    $TargetApkPath = "android/build/app/outputs/flutter-apk/app-release.apk"
}
$PcPathList = Get-ChildItem -Path "cp_clip/dist_electron/ShareCLIP*.exe" | Sort-Object LastWriteTime -Descending

if (-not (Test-Path $TargetApkPath)) {
    Write-Error "APK file for version $VersionOnly not found!"
    exit 1
}

if ($PcPathList.Count -eq 0) {
    Write-Error "Electron installer .exe not found!"
    exit 1
}

$AssetsToUpload = @()
$AssetsToUpload += (Get-Item $TargetApkPath).FullName
foreach ($File in $PcPathList) {
    # Only upload files that match the exact current version string
    if ($File.Name -match [regex]::Escape($VersionOnly)) {
        $AssetsToUpload += $File.FullName
    }
}

# Scan and upload all differential update .blockmap files for NSIS incremental upgrades
$BlockmapFileList = Get-ChildItem -Path "cp_clip/dist_electron/*.blockmap"
foreach ($Bm in $BlockmapFileList) {
    if ($Bm.Name -match [regex]::Escape($VersionOnly)) {
        if ($AssetsToUpload -notcontains $Bm.FullName) {
            $AssetsToUpload += $Bm.FullName
        }
    }
}

# Upload latest.yml for electron-updater
$LatestYmlPath = "cp_clip/dist_electron/latest.yml"
if (Test-Path $LatestYmlPath) {
    $AssetsToUpload += $LatestYmlPath
}

Write-Host "Uploading assets:" -ForegroundColor Gray
foreach ($Asset in $AssetsToUpload) {
    Write-Host "  - Asset: $Asset" -ForegroundColor Gray
}

# Attempt to delete the release and tag if they already exist, to ensure a clean re-entrant build
Write-Host "Cleaning up existing release/tag $Tag (if any)..." -ForegroundColor Gray
& $GhCmd release delete $Tag -y --cleanup-tag --repo $Repo 2>$null

# Use GitHub CLI to create release and upload
& $GhCmd release create $Tag $AssetsToUpload --title "ShareCLIP $Tag" --notes "Automated release containing PC installer, portable executable, and Android APK for $Tag." --repo $Repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Deployment completed successfully! Check your repo: https://github.com/$Repo/releases" -ForegroundColor Yellow
} else {
    Write-Error "GitHub release creation failed! Please ensure you have run 'gh auth login'."
}
