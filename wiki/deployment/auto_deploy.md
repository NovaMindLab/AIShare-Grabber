# 🚀 ShareCLIP Automated Deployment Guide

This documentation describes the automatic deployment pipeline configured for the **ShareCLIP** companion system. All build artifacts (Electron Windows App, Android APK, and the web portal homepage) can be automatically compiled and published to GitHub.

---

## 📂 Deployment Assets

All deployment scripts and configurations are located in the [auto_deploy/](file:///d:/AI_serach_image/image_clip_android/auto_deploy/) directory:
1.  **[deploy.ps1](file:///d:/AI_serach_image/image_clip_android/auto_deploy/deploy.ps1)**: A PowerShell script for local Windows build automation. It compiles all three components and pushes releases directly using the GitHub CLI.
2.  **[github-actions.yml](file:///d:/AI_serach_image/image_clip_android/auto_deploy/github-actions.yml)**: A template GitHub Actions workflow to run builds in a secure cloud runner upon tagging version releases.

---

## 🛠️ Local Deploy Script (PowerShell)

### Prerequisites
Before running the local deployment script, ensure you have installed and configured the following dependencies on your Windows machine:
1.  **Git & GitHub CLI (`gh`)**: Install GitHub CLI and authenticate:
    ```powershell
    gh auth login
    ```
2.  **Flutter SDK**: The command `flutter` must be accessible in your system path.
3.  **Node.js (v18+) & NPM**: Required for building the web frontend and Electron desktop app.

### How to Run (Gitee & GitHub Coexistence Setup)
If your primary codebase remote `origin` is pointing to **Gitee (码云)**, configure GitHub as a secondary remote named `github` to avoid conflicts:

```bash
# 1. Add GitHub as a secondary remote named "github"
git remote add github https://github.com/NovaMindLab/AIShare-Grabber.git

# 2. Push your main branch code to GitHub
git push -u github master:main
```

Then, run the PowerShell script to build and deploy your app and web assets directly to GitHub:

```powershell
# Execute the release script (replace tag with your version)
.\auto_deploy\deploy.ps1 -Tag "v1.0.1" -Repo "NovaMindLab/AIShare-Grabber"
```

### Automation Workflow
When executed, the script automatically completes the following tasks:
1.  **Web Portal Build**: Generates static web pages inside `cp_clip/dist/`.
2.  **Electron Desktop Build**: Packages the portable Windows application executable inside `cp_clip/dist_electron/`.
3.  **Android APK Build**: Compiles the release package (`app-release.apk`) inside `android/build/app/outputs/flutter-apk/`.
4.  **GitHub Pages Deploy**: Pushes the static web folder directly to your repo's `gh-pages` branch.
5.  **GitHub Release**: Creates a new release under the specified tag and uploads both the PC `.exe` binary and the mobile `.apk` file as release assets.

---

## ☁️ Cloud CI/CD (GitHub Actions)

To enable fully automated cloud-based releases:
1.  Create a folder `.github/workflows/` at the root of your GitHub repository.
2.  Copy [github-actions.yml](file:///d:/AI_serach_image/image_clip_android/auto_deploy/github-actions.yml) into that folder and rename it to `deploy.yml`.
3.  Push the changes to GitHub (to your secondary remote):
    ```bash
    git add .github/workflows/deploy.yml
    git commit -m "Add GitHub Actions deploy pipeline"
    git push github master:main
    ```
4.  Go to your repository **Settings > Pages** on GitHub and set the source to **GitHub Actions** (to allow `actions/deploy-pages` to compile and publish the website automatically).
5.  Tag a release commit locally and push the tag to GitHub:
    ```bash
    git tag v1.0.1
    git push github v1.0.1
    ```
GitHub Actions will automatically spin up Windows and Linux virtual runners, compile the Android APK, package the Electron portable binary, deploy the homepage to GitHub Pages, and publish them as a release bundle!

---

## 📋 Release Changelog

| Version | Tag     | GitHub Release Link | Highlights |
|---------|---------|---------------------|------------|
| v1.0.1  | v1.0.1  | [v1.0.1](https://github.com/NovaMindLab/AIShare-Grabber/releases/tag/v1.0.1) | Added 20-language i18n support for PC EXE, Android APK, and official web portal |
| v1.0.0  | v1.0.0  | [v1.0.0](https://github.com/NovaMindLab/AIShare-Grabber/releases/tag/v1.0.0) | Initial release — Android ↔ PC BLE/WebRTC sync, MobileCLIP AI image search |

> 💡 **Tip**: The official website is live at [https://NovaMindLab.github.io/AIShare-Grabber/](https://NovaMindLab.github.io/AIShare-Grabber/)

---

## 🔗 Related Pages

- [i18n / Multi-language Support](file:///d:/AI_serach_image/image_clip_android/wiki/i18n.md)
- [Android Client Overview](file:///d:/AI_serach_image/image_clip_android/wiki/android/README.md)
- [PC Desktop Client Overview](file:///d:/AI_serach_image/image_clip_android/wiki/pc/README.md)
