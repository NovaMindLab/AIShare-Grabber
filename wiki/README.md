# ShareCLIP Project Documentation Wiki

Welcome to the central **ShareCLIP** documentation wiki. ShareCLIP is a premium multi-device photo synchronization and AI-powered local classification ecosystem.

Choose a platform below to view its specific design, protocol, and deployment documentation:

---

## 📱 [Android Mobile Client](file:///d:/AI_serach_image/image_clip_android/wiki/android/README.md)
Contains mobile architecture details, camera scanners, local media database querying, and the BLE/WebRTC native clients.
*   [BLE Signaling Protocol](file:///d:/AI_serach_image/image_clip_android/wiki/android/BLE_Signaling.md): Scan, MTU negotiation, and chunked SDP notification transmission.
*   [WebRTC Channel Protocol](file:///d:/AI_serach_image/image_clip_android/wiki/android/WebRTC_Protocol.md): Direct data links, 16-byte binary packet structures, and flow control.
*   [Permissions Configuration](file:///d:/AI_serach_image/image_clip_android/wiki/android/Permissions.md): Two-stage runtime permission flow, AndroidManifest declarations, Android 13+ granular media permissions, and troubleshooting guide.
*   [Transfer Console Dashboard UI](file:///d:/AI_serach_image/image_clip_android/wiki/android/UI_Dashboard.md): 4-tab sliding dashboard design (Media, Music, Docs, Queue), widget map, design tokens, and interaction model.

---

## 🖥️ [PC Desktop Client](file:///d:/AI_serach_image/image_clip_android/wiki/pc/README.md)
Details the Electron main lifecycle process, ONNX AI classification model integration, and local database ingestion.
*   [Preprocessing & Normalization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/preprocessing_and_normalization.md): MobileCLIP normalization guidelines and pixel scaling.
*   [Model Reparameterization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/model_reparameterization.md): Reparameterizing and exporting MobileCLIP to a single ONNX file.
*   [Packaging & Deployment](file:///d:/AI_serach_image/image_clip_android/wiki/pc/packaging_and_deployment.md): Building the Electron installer with self-contained assets.

---

## 🌐 [Web Official Website](file:///d:/AI_serach_image/image_clip_android/wiki/web/README.md)
Details the structure, styling, and design system of the official ShareCLIP product website.
*   [Web Landing Page Codebase](file:///d:/AI_serach_image/image_clip_android/web/): Source files for the Vue 3 + Vite official portal.

---

## 🌍 [Internationalization (i18n)](file:///d:/AI_serach_image/image_clip_android/wiki/i18n.md)
Documents the 20-language support added in **v1.0.1** across all three platforms.
*   [i18n Architecture & String Keys](file:///d:/AI_serach_image/image_clip_android/wiki/i18n.md): Language list, locale files, persistence strategy, Flutter `LocalizationService`, and Vue computed locale binding.

---

## 🚀 [CI/CD & Deployment](file:///d:/AI_serach_image/image_clip_android/wiki/deployment/auto_deploy.md)
Guidelines for automated builds and releases:
*   [Automated Deployment Guide](file:///d:/AI_serach_image/image_clip_android/wiki/deployment/auto_deploy.md): Local PowerShell compilation and GitHub Actions release automation.

---

## 📋 Release Changelog

| Version | Date       | Highlights |
|---------|------------|------------|
| v1.0.1  | 2026-06-29 | 20-language i18n support for PC EXE, Android APK, and web portal. Default language: English. |
| v1.0.0  | 2026-06-29 | Initial public release — Android ↔ PC BLE/WebRTC sync, AI MobileCLIP image classification, official website. |
