# MobileCLIP Image Sync Companion App Wiki

Welcome to the MobileCLIP Image Sync Companion App Wiki. This documentation explains the architecture, connection handshakes, and transmission protocols implemented on the Android client (Flutter).

---

## 1. Architectural Overview

The companion app acts as a local "near-field data companion" to the desktop app. It allows the user to select photos from their mobile album and transfer them securely over local network interfaces using WebRTC.

```
+------------------+         (BLE Scan / Connect)        +------------------+
|                  | ----------------------------------> |                  |
|   Android App    |                                     |   Desktop App    |
|   (GATT Client)  | <---------------------------------- |   (GATT Server)  |
|                  |      (BLE Notify: Answer & ICE)     |                  |
+------------------+                                     +------------------+
         |                                                        |
         |                   =================                    |
         +=================> # WebRTC Tunnel # <==================+
                             (Direct Data Link)
```

### Key Stages of Connection:
1.  **Phase 1: QR Scanning** (CameraX + ML Kit): Parses the PC-provided connection parameters (MAC address, UUIDs, Session ID).
2.  **Phase 2: BLE Signaling** (`flutter_blue_plus`): Uses Bluetooth Low Energy as a signaling channel to exchange WebRTC Offer/Answer SDPs and ICE candidates.
3.  **Phase 3: WebRTC Sync** (`flutter_webrtc`): Establishes a direct peer-to-peer `RTCDataChannel` link.
4.  **Phase 4: Gallery Streaming** (`photo_manager`): Loads and resizes album photos, chunking them into 32KB binary packages with coroutine-based backpressure.

---

## 2. File Index

All source code files are structured in the `./android/lib` directory:

*   [lib/main.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/main.dart): App entry point, theme declaration, and runtime permission request flow.
*   [lib/models/qr_payload.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/models/qr_payload.dart): JSON deserializer model for scanned connection QR codes.
*   [lib/services/ble_signaling_client.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/services/ble_signaling_client.dart): BLE scanner and GATT client manager. Performs SDP fragmentation and notification reassembly.
*   [lib/services/webrtc_sync_engine.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/services/webrtc_sync_engine.dart): Sets up `RTCPeerConnection` and handles local Offer SDP creation, Answer parsing, ICE candidates, and `RTCDataChannel` creation.
*   [lib/services/photo_streamer.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/services/photo_streamer.dart): Queries the system MediaStore, performs native fast image resizing/compression, and streams binary chunks over the data channel with backpressure.
*   [lib/viewmodels/sync_viewmodel.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/viewmodels/sync_viewmodel.dart): `ChangeNotifier` state machine coordinator between user actions, view states, BLE signaling, and WebRTC sync.
*   [lib/views/qr_scanner_view.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/views/qr_scanner_view.dart): Camera preview view featuring animated neon scanning frames.
*   [lib/views/transfer_console_view.dart](file:///d:/AI_serach_image/image_clip_android/android/lib/views/transfer_console_view.dart): Grid picker view loading gallery thumbnails, real-time speed metrics, file sync status logs, and active progress indicators.

---

## 3. Sub-Protocol Documentation

For detailed information on the communication protocols, see:
*   [wiki/BLE_Signaling.md](file:///d:/AI_serach_image/image_clip_android/wiki/BLE_Signaling.md): Details the BLE scan, connect, service discovery, MTU negotiation, and SDP/ICE candidate chunking format.
*   [wiki/WebRTC_Protocol.md](file:///d:/AI_serach_image/image_clip_android/wiki/WebRTC_Protocol.md): Details WebRTC PeerConnection, the 16-byte packet header format, and DataChannel backpressure flow control.
