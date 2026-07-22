# BLE Signaling Protocol Specification

The companion app acts as a **BLE GATT Client (Central)**, and the desktop app acts as a **BLE GATT Server (Peripheral)**. BLE is used as the signaling channel to exchange WebRTC offer/answer session descriptions (SDP) and ICE candidates.

---

## 1. Connection Parameters (QR Payload)

Connection settings are parsed from the scanned QR code in the following format:
```json
{
  "ble_mac": "XX:XX:XX:XX:XX:XX",
  "service_uuid": "00000000-0000-0000-0000-000000000000",
  "char_uuid": "00000000-0000-0000-0000-000000000000",
  "session_id": "1001"
}
```

*   `ble_mac`: MAC address of the host machine's BLE card.
*   `service_uuid`: Target GATT Service UUID.
*   `char_uuid`: Target GATT Characteristic UUID (must support both WRITE and NOTIFY/INDICATE properties).
*   `session_id`: Unique identifier to filter noise and match the active session.

---

## 2. GATT Handshake Flow

1.  **Scan**: The client starts a BLE scan with a MAC filter using `lowLatency` scan mode.
2.  **Connect**: Once found, it establishes a GATT connection with `autoConnect: false` to force immediate connection.
3.  **MTU Negotiation**: The client requests an MTU size of **512 bytes**. Larger MTUs increase the throughput of SDP segment writes.
4.  **Service Discovery**: Services and characteristics are queried on the device.
5.  **Notifications**: The client enables notifications on the target characteristic by calling `setNotifyValue(true)` and writing `ENABLE_NOTIFICATION_VALUE` (`[0x01, 0x00]`) to the Client Characteristic Configuration Descriptor (CCCD, UUID `2902`).

---

## 3. Chunked Transmission Protocol

Since BLE packets are limited in size, long strings like SDP descriptions (~2-3KB) are split into chunks of **150 bytes**.

```
+--------------------------------------------------------+
| START:session_id:total_chunks                          | (Initial Packet)
+--------------------------------------------------------+
                           |
                           v
+--------------------------------------------------------+
| CHUNK:session_id:chunk_index:payload_text              | (Data Packet 1)
+--------------------------------------------------------+
                           |
                           v
+--------------------------------------------------------+
| CHUNK:session_id:chunk_index_2:payload_text_2          | (Data Packet 2...)
+--------------------------------------------------------+
                           |
                           v
+--------------------------------------------------------+
| END:session_id                                         | (Completion Packet)
+--------------------------------------------------------+
```

### Protocol Prefixes:
*   **START Packet**: `START:<session_id>:<total_chunks>`
    *   Prepares the receiver's buffer, allocating space and clearing old cache.
*   **CHUNK Packet**: `CHUNK:<session_id>:<chunk_index>:<payload_text>`
    *   `chunk_index`: 0-indexed integer.
    *   `payload_text`: The raw ASCII segment of the SDP.
*   **END Packet**: `END:<session_id>`
    *   Signals that transmission is complete. The receiver joins all collected chunks and injects the resulting SDP string.
*   **ICE Candidate**: `ICE:<session_id>:<sdpMid>:<sdpMLineIndex>:<candidate_string>`
    *   Transmits gathered local network ICE Candidates dynamically. These do not require chunking because they are small.

---

## 4. Congestion & Write Flow Control

To ensure packets are not lost when transmitting sequentially:
*   Android writes are executed with response confirmation (`withoutResponse: false`).
*   The writing coroutine/future suspends and awaits the BLE stack's GATT write response for each packet before proceeding.
*   A small yield delay of **30ms** is inserted between chunks to allow the hardware buffers to cool down.
