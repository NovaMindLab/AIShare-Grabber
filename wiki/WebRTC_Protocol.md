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

## 2. Photo Streaming Packet Layout

Large image files (~2-15MB) are compressed, resized natively to a maximum width of 1920px (encoded as compressed PNG or JPEG), and split into **32KB** chunks.

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
*   `chunk_index` (4-byte Big-Endian Int): 0-indexed count of the current packet.
*   `total_chunks` (4-byte Big-Endian Int): Total chunks required to transmit the entire file.
*   `payload_size` (4-byte Big-Endian Int): The size of the raw payload following the header in bytes (maximum `32768`).
*   `payload` (Byte array, max 32KB): The raw binary segment of the image file.

---

## 3. Backpressure Flow Control Algorithm

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
