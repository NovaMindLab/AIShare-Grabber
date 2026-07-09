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
    $PkgJson | ConvertTo-Json -Depth 10 | Set-Content $PkgJsonPath -Encoding utf8
}

if (Test-Path $WebPkgPath) {
    Write-Host "Updating version in $WebPkgPath to $VersionOnly" -ForegroundColor Gray
    $WebPkg = Get-Content $WebPkgPath -Raw -Encoding utf8 | ConvertFrom-Json
    $WebPkg.version = $VersionOnly
    $WebPkg | ConvertTo-Json -Depth 10 | Set-Content $WebPkgPath -Encoding utf8
}

if (Test-Path $PubspecPath) {
    Write-Host "Updating version in $PubspecPath to $VersionOnly+1" -ForegroundColor Gray
    $PubspecContent = Get-Content $PubspecPath -Encoding utf8
    $PubspecContent = $PubspecContent -replace "^version:\s+.*", "version: $VersionOnly+1"
    $PubspecContent | Set-Content $PubspecPath -Encoding utf8
}

$AndroidMainDart = "android/lib/main.dart"
if (Test-Path $AndroidMainDart) {
    Write-Host "Updating version in $AndroidMainDart to $VersionOnly" -ForegroundColor Gray
    $DartContent = Get-Content $AndroidMainDart -Encoding utf8
    $DartContent = $DartContent -replace "const String appVersion = '.*';", "const String appVersion = '$VersionOnly';"
    $DartContent | Set-Content $AndroidMainDart -Encoding utf8
}

# Commit and push version bump to git repositories
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    $Diff = git status --porcelain
    if ($Diff) {
        Write-Host "Committing version bump to Git..." -ForegroundColor Yellow
        git add $PkgJsonPath $WebPkgPath $PubspecPath $AndroidMainDart
        git commit -m "chore: bump version to $VersionOnly for deployment"
        Write-Host "Pushing version bump to Gitee (origin) and GitHub (github)..." -ForegroundColor Yellow
        git push origin master --quiet
        git push github master:main --quiet
    }
}

# 1. Clean and build Web site (web/dist) with dynamic repository base path
Write-Host "`n📁 Step 1: Building Static Web Page..." -ForegroundColor Green
$ProjName = $Repo.Split('/')[1]
Set-Location "web"
npm install
npx vite build --base=/$ProjName/
if ($LASTEXITCODE -ne 0) {
    Write-Error "Web page build failed!"
    exit 1
}
Set-Location ".."

# 2. Build Electron Desktop Application
Write-Host "`n📁 Step 2: Packaging Electron App..." -ForegroundColor Green
Set-Location "cp_clip"
npm install
npm run build
npm run dist
if ($LASTEXITCODE -ne 0) {
    Write-Error "Electron packaging failed!"
    exit 1
}
Set-Location ".."

# 3. Build Android Mobile APK
Write-Host "`n📁 Step 3: Compiling Android APK..." -ForegroundColor Green
Set-Location "android"
& $FlutterCmd build apk --release --build-name $VersionOnly --build-number 1 --no-tree-shake-icons
if ($LASTEXITCODE -ne 0) {
    Write-Error "Android compilation failed!"
    exit 1
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

# Find builds
$ApkPath = "android/build/app/outputs/flutter-apk/app-release.apk"
$PcPathList = Get-ChildItem -Path "cp_clip/dist_electron/ShareCLIP*.exe" | Sort-Object LastWriteTime -Descending

if (-not (Test-Path $ApkPath)) {
    Write-Error "APK file not found!"
    exit 1
}

if ($PcPathList.Count -eq 0) {
    Write-Error "Electron installer .exe not found!"
    exit 1
}

$AssetsToUpload = @($ApkPath)
foreach ($File in $PcPathList) {
    # Only upload files that have the current version or contain setup/portable
    if ($File.Name -match "Setup" -or $File.Name -match $VersionOnly) {
        $AssetsToUpload += $File.FullName
    }
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
