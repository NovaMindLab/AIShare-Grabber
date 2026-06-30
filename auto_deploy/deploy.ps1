# ShareCLIP Automatic Build & GitHub Deploy Script
# Make sure to run this script from the project root directory.
# Prerequisites:
# 1. GitHub CLI (gh) installed and authenticated: run 'gh auth login'
# 2. Git CLI installed
# 3. Flutter SDK installed
# 4. Node.js & npm installed

param (
    [string]$Tag = "",
    [string]$Repo = "NovaMindLab/AIShare-Grabber"
)

if ([string]::IsNullOrEmpty($Tag)) {
    $Tag = "v" + (Get-Date -Format "yyyy.MM.dd-HHmm")
    Write-Host "No tag specified. Generating automatic tag: $Tag" -ForegroundColor Yellow
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
npm run dist
if ($LASTEXITCODE -ne 0) {
    Write-Error "Electron packaging failed!"
    exit 1
}
Set-Location ".."

# 3. Build Android Mobile APK
Write-Host "`n📁 Step 3: Compiling Android APK..." -ForegroundColor Green
Set-Location "android"
& $FlutterCmd build apk --release --no-tree-shake-icons
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
$PcPathList = Get-ChildItem -Path "cp_clip/dist_electron/ShareCLIP*.exe"

if (-not (Test-Path $ApkPath)) {
    Write-Error "APK file not found!"
    exit 1
}

if ($PcPathList.Count -eq 0) {
    Write-Error "Electron installer .exe not found!"
    exit 1
}
$PcPath = $PcPathList[0].FullName

Write-Host "Uploading assets:" -ForegroundColor Gray
Write-Host "  - Mobile APK: $ApkPath" -ForegroundColor Gray
Write-Host "  - PC Executable: $PcPath" -ForegroundColor Gray

# Attempt to delete the release and tag if they already exist, to ensure a clean re-entrant build
Write-Host "Cleaning up existing release/tag $Tag (if any)..." -ForegroundColor Gray
& $GhCmd release delete $Tag -y --cleanup-tag --repo $Repo 2>$null

# Use GitHub CLI to create release and upload
& $GhCmd release create $Tag $PcPath $ApkPath --title "ShareCLIP $Tag" --notes "Automated release containing PC client and Android APK for $Tag." --repo $Repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Deployment completed successfully! Check your repo: https://github.com/$Repo/releases" -ForegroundColor Yellow
} else {
    Write-Error "GitHub release creation failed! Please ensure you have run 'gh auth login'."
}
