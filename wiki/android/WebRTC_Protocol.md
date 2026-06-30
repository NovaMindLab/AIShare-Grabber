# WebRTC Sync Protocol Specification

Once the BLE signaling handshake completes, direct peer-to-peer communication is established using WebRTC. Album photos are streamed in binary chunks over a dedicated `RTCDataChannel`.

---

## 1. Connection Configurations

*   **Ice Servers**: STUN server `stun:stun.l.google.com:19302` is configured to query local public reflection ports.
*   **SDP Semantics**: Unified-Plan.
*   **Media Tracks**: Off (no audio or video tracks are created). This is a pure data-channel setup.
*   **DataChannel Parameters**:
    *   **Label**: `photo_sync`
    *   **Ordered**: `true` (guarantees packet arrival sequence)
    *   **Reliability**: TCP-like (retransmits packets until success; no max retransmissions limit)

---

## 2. File Streaming Packet Layout

Large files (photos, videos, audio clips, documents) are split into **32KB** chunks. To prevent memory Out-Of-Memory (OOM) crashes, files are read dynamically chunk-by-chunk using a `RandomAccessFile` stream (Dart) instead of being loaded fully into RAM. Furthermore, images and videos are streamed in their raw original format to preserve full resolution, metadata, and EXIF attributes.

Each binary chunk is enveloped with a **16-byte header**:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                           file_id                             | (Bytes 0-3)
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         chunk_index                           | (Bytes 4-7)
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         total_chunks                          | (Bytes 8-11)
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         payload_size                          | (Bytes 12-15)
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                            payload                            | (Bytes 16+)
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Header Specifications:
*   `file_id` (4-byte Big-Endian Int): Unique identifier assigned to the file being synced.
    *   **Special values** are reserved for the **Heartbeat Protocol** (see section 4).
*   `chunk_index` (4-byte Big-Endian Int): 0-indexed count of the current packet.
*   `total_chunks` (4-byte Big-Endian Int): Total chunks required to transmit the entire file.
*   `payload_size` (4-byte Big-Endian Int): The size of the raw payload following the header in bytes (maximum `32768`).
*   `payload` (Byte array, max 32KB): The raw binary segment of the file.

### 2.1 File Format Identification via Magic Bytes
To avoid altering the 16-byte header footprint or adding metadata handshake text messages, the receiving side dynamically detects the file format by checking the reassembled binary payload's leading bytes (magic bytes):

*   **Images**: PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), GIF (`47 49 46`), WebP (`RIFF...WEBP`).
*   **Audio**: MP3 (`49 44 33` / `FF FB`), WAV (`RIFF...WAVE`), FLAC (`fLaC`).
*   **Video**: MP4 (`....ftyp`), MKV/WebM (`1A 45 DF A3`).
*   **Documents/Archives**: PDF (`%PDF`), ZIP (`PK\x03\x04`), RAR (`Rar!`), 7Z (`7z\xBC\xAF`).

---

## 3. Heartbeat Protocol (Ping/Pong)

To detect sudden connection dropouts or app closures immediately (instead of waiting for the WebRTC/OS TCP connection timeout), a heartbeat check is run over the DataChannel.

### 3.1 Packet Specification
Heartbeats are sent as 16-byte empty header packets:
*   **Ping Packet**: `file_id = -1`, `chunk_index = 0`, `total_chunks = 0`, `payload_size = 0`.
*   **Pong Packet**: `file_id = -2`, `chunk_index = 0`, `total_chunks = 0`, `payload_size = 0`.

### 3.2 State Machine & Timing
1. **Periodic Ping**: The Android mobile client acts as the initiator and transmits a Ping packet (`file_id = -1`) over the data channel once every **3 seconds**.
2. **Immediate Pong**: Upon receiving a packet with `file_id = -1`, the PC desktop client immediately replies with a Pong packet (`file_id = -2`).
3. **Timeout Detection**:
   - Both clients maintain a `lastHeartbeatTime` timestamp, which is updated whenever a Ping or Pong packet is received.
   - If either side fails to receive any heartbeat packet for **15 seconds** (equivalent to 5 consecutive lost heartbeats), the connection is declared dead.
   - The connection is cleanly torn down (`cleanupWebRtc()` on PC, `resetToScanner()` on Android) and the app reverts to scanning state to await reconnect.

---

## 4. Backpressure Flow Control Algorithm

WebRTC socket buffers can overflow if binary chunks are pushed faster than the network can transmit them, leading to socket drops or high memory usage (OOM).

To prevent this, the client monitors the socket's write buffer and pauses the sender loop when congestion is detected:

```
[Start Sending Chunks]
         |
         v
+------------------+
|  Get Chunk (i)   |
+------------------+
         |
         v
+-----------------------------+
| Is bufferedAmount > 1.0MB?  | <------+
+-----------------------------+        | (Buffer Congested)
         |                             |
         +---(Yes)---> [Delay 30ms] ---+
         |
       (No)
         |
         v
+--------------------+
| Send Binary Chunk  |
+--------------------+
         |
         v
+------------------+
|   Increment (i)  |
+------------------+
         |
         v
+-----------------------+
|  Is i < totalChunks?  | --(Yes)--> [Loop Next]
+-----------------------+
         |
       (No)
         |
         v
  [Sync Finished]
```

### Code Implementation Details:
*   **Threshold**: `1,000,000` bytes.
*   **Check interval**: `30 milliseconds`.
*   **Mechanism**: A non-blocking asynchronous wait (`await Future.delayed(...)`) yields thread execution without freezing the UI or blocking CPU registers.
