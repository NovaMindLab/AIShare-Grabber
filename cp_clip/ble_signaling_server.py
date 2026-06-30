import sys
import asyncio
import logging
from uuid import UUID
from bless import BlessServer, BlessGATTCharacteristic, GATTCharacteristicProperties, GATTAttributePermissions
from winrt.windows.devices.bluetooth import BluetoothAdapter

# Configure logging to sys.stderr so it doesn't pollute stdout (which is used for IPC messages)
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger("BLE_Signaling_Server")

# Target Service & Characteristic configuration
service_uuid = ""
char_uuid = ""
session_id = ""

# Reassemble buffer
incoming_chunks = {}
expected_chunks = -1

# BLE Server Instance
server = None

# Notification Queue for Windows BLE flow control
notification_queue = asyncio.Queue()

async def query_local_mac():
    try:
        adapter = await BluetoothAdapter.get_default_async()
        if adapter is None:
            return None
        mac_address = adapter.bluetooth_address
        mac_parts = []
        for i in range(40, -1, -8):
            part = (mac_address >> i) & 0xff
            mac_parts.append(f"{part:02X}")
        return ":".join(mac_parts)
    except Exception as e:
        logger.error(f"Failed to query MAC address: {e}")
        return None

def handle_write(characteristic, value: bytearray):
    global expected_chunks, incoming_chunks
    try:
        text = value.decode("utf-8")
        logger.info(f"Received BLE write: {text}")
        
        parts = text.split(":")
        if not parts:
            return
            
        msg_type = parts[0]
        if msg_type == "START":
            # START:<session_id>:<total_chunks>
            if len(parts) >= 3:
                sess = parts[1]
                if sess == session_id:
                    expected_chunks = int(parts[2])
                    incoming_chunks.clear()
                    logger.info(f"Offer SDP incoming. Expecting {expected_chunks} chunks.")
                    print("STATUS:CONNECTED", flush=True)
                    
        elif msg_type == "CHUNK":
            # CHUNK:<session_id>:<index>:<payload>
            if len(parts) >= 4:
                sess = parts[1]
                if sess == session_id:
                    index = int(parts[2])
                    # Reconstruct payload that might contain colons
                    prefix = f"CHUNK:{sess}:{index}:"
                    if len(text) > len(prefix):
                        payload = text[len(prefix):]
                        incoming_chunks[index] = payload
                        logger.debug(f"Received chunk {index}/{expected_chunks}")
                        
        elif msg_type == "END":
            # END:<session_id>
            if len(parts) >= 2:
                sess = parts[1]
                if sess == session_id:
                    if expected_chunks > 0 and len(incoming_chunks) == expected_chunks:
                        sdp_builder = []
                        for i in range(expected_chunks):
                            sdp_builder.append(incoming_chunks[i])
                        assembled_sdp = "".join(sdp_builder)
                        logger.info(f"Successfully reassembled Offer SDP (Length: {len(assembled_sdp)})")
                        # Output complete Offer SDP on a single line to stdout
                        # Escape newlines as \n to keep it on one line
                        escaped_sdp = assembled_sdp.replace("\n", "\\n").replace("\r", "\\r")
                        print(f"SDP:OFFER:{escaped_sdp}", flush=True)
                    else:
                        logger.error(f"SDP assembly failed. Received {len(incoming_chunks)}/{expected_chunks} chunks.")
                        
        elif msg_type == "ICE":
            # ICE:<session_id>:<sdpMid>:<sdpMLineIndex>:<candidate>
            if len(parts) >= 5:
                sess = parts[1]
                if sess == session_id:
                    sdp_mid = parts[2]
                    sdp_mline_index = parts[3]
                    prefix = f"ICE:{sess}:{sdp_mid}:{sdp_mline_index}:"
                    if len(text) > len(prefix):
                        candidate = text[len(prefix):]
                        # Output the candidate
                        print(f"ICE:{sdp_mid}:{sdp_mline_index}:{candidate}", flush=True)
                        
        elif msg_type == "LOG":
            # LOG:<session_id>:<log_message>
            if len(parts) >= 3:
                sess = parts[1]
                if sess == session_id:
                    prefix = f"LOG:{sess}:"
                    if len(text) > len(prefix):
                        log_msg = text[len(prefix):]
                        print(f"PHONE_LOG:{log_msg}", flush=True)
                        
    except Exception as e:
        logger.error(f"Error in write callback: {e}")

def handle_read(characteristic):
    # Standard read callback
    return bytearray([0])

async def send_notify(message: str):
    # Simply push the notification to the queue, the worker task will handle pacing
    await notification_queue.put(message)
    logger.debug(f"Queued notification: {message[:40]}...")

async def notification_worker():
    global server, service_uuid, char_uuid
    logger.info("BLE notification queue worker started.")
    while True:
        message = await notification_queue.get()
        try:
            char = server.get_characteristic(char_uuid)
            if char is not None:
                char.value = bytearray(message.encode("utf-8"))
                server.update_value(service_uuid, char_uuid)
                logger.info(f"Successfully notified BLE: {message[:45]}...")
        except Exception as e:
            logger.error(f"Failed to send BLE notification: {e}")
        finally:
            notification_queue.task_done()
        # Safe delay of 80ms on Windows to let the bluetooth adapter process and send the frame
        await asyncio.sleep(0.08)

async def handle_stdin_commands():
    global session_id
    loop = asyncio.get_event_loop()
    logger.info("Stdin reader loop started.")
    while True:
        # sys.stdin.readline is blocking, run it in the default executor thread pool
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        
        line = line.strip()
        if not line:
            continue
            
        logger.info(f"Stdin command received: {line[:50]}...")
        
        parts = line.split(":", 1)
        if len(parts) < 2:
            continue
            
        cmd_type = parts[0]
        payload = parts[1]
        
        if cmd_type == "ANSWER":
            # Unescape newlines
            sdp = payload.replace("\\n", "\n").replace("\\r", "\r")
            
            # Segment the SDP into 150-byte chunks
            chunk_size = 150
            chunks = []
            offset = 0
            while offset < len(sdp):
                end = min(offset + chunk_size, len(sdp))
                chunks.append(sdp[offset:end])
                offset = end
                
            logger.info(f"Pacing Answer SDP in {len(chunks)} chunks over BLE notifications queue.")
            
            # Send START
            await send_notify(f"START:{session_id}:{len(chunks)}")
            
            # Send CHUNKS
            for idx, chunk in enumerate(chunks):
                await send_notify(f"CHUNK:{session_id}:{idx}:{chunk}")
                
            # Send END
            await send_notify(f"END:{session_id}")
            logger.info("Finished queuing Answer SDP.")
            
        elif cmd_type == "ICE":
            # Payload format: sdpMid:sdpMLineIndex:candidate_string
            ice_parts = payload.split(":", 2)
            if len(ice_parts) >= 3:
                sdp_mid = ice_parts[0]
                sdp_mline_index = ice_parts[1]
                candidate = ice_parts[2]
                
                msg = f"ICE:{session_id}:{sdp_mid}:{sdp_mline_index}:{candidate}"
                await send_notify(msg)

async def main():
    global server, service_uuid, char_uuid, session_id
    
    if len(sys.argv) < 4:
        logger.error("Usage: ble_signaling_server.py <service_uuid> <char_uuid> <session_id>")
        sys.exit(1)
        
    service_uuid = sys.argv[1].lower()
    char_uuid = sys.argv[2].lower()
    session_id = sys.argv[3]
    
    logger.info("Initializing MobileCLIP BLE Signaling Server...")
    
    # 1. Query MAC
    mac = await query_local_mac()
    if mac:
        print(f"MAC:{mac}", flush=True)
        logger.info(f"Reported Local Bluetooth MAC: {mac}")
    else:
        print("ERROR:NO_ADAPTER", flush=True)
        logger.error("No default Bluetooth adapter found.")
        sys.exit(1)
        
    # 2. Build BLE server
    server = BlessServer(name="MobileCLIP_PC_GATT")
    server.read_request_func = handle_read
    server.write_request_func = handle_write
    
    properties = (
        GATTCharacteristicProperties.read |
        GATTCharacteristicProperties.write |
        GATTCharacteristicProperties.notify
    )
    permissions = (
        GATTAttributePermissions.readable |
        GATTAttributePermissions.writeable
    )
    
    await server.add_new_service(service_uuid)
    await server.add_new_characteristic(
        service_uuid,
        char_uuid,
        properties,
        bytes([0]),
        permissions
    )
    
    # 3. Start advertising
    logger.info("Starting BLE GATT advertising...")
    await server.start()
    print("STATUS:ADVERTISING", flush=True)
    logger.info("BLE GATT Server advertising started successfully.")
    
    # 4. Start notification worker task
    worker_task = asyncio.create_task(notification_worker())
    
    # 5. Start stdin commands loop and keep server running
    try:
        await handle_stdin_commands()
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Exception in stdin reader: {e}")
    finally:
        logger.info("Stopping BLE GATT Server...")
        worker_task.cancel()
        await server.stop()
        logger.info("BLE GATT Server stopped.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Terminated by user.")
