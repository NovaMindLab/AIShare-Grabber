#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.Devices.Bluetooth.h>
#include <winrt/Windows.Devices.Bluetooth.GenericAttributeProfile.h>
#include <winrt/Windows.Storage.Streams.h>
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <sstream>
#include <thread>
#include <mutex>
#include <queue>
#include <condition_variable>
#include <algorithm>

using namespace winrt;
using namespace Windows::Foundation;
using namespace Windows::Devices::Bluetooth;
using namespace Windows::Devices::Bluetooth::GenericAttributeProfile;
using namespace Windows::Storage::Streams;

// GUID Parser Helper
winrt::guid parse_uuid(std::string const& str) {
    unsigned long d1;
    unsigned int d2, d3;
    unsigned int bytes[8];
    // UUID can have dashes at 8-4-4-4-12 structure: 6e400001-b5a3-f393-e0a9-e50e24dcca9e
    // Let's parse with dashes
    if (sscanf_s(str.c_str(), "%8lx-%4x-%4x-%2x%2x-%2x%2x%2x%2x%2x%2x",
        &d1, &d2, &d3,
        &bytes[0], &bytes[1], &bytes[2], &bytes[3],
        &bytes[4], &bytes[5], &bytes[6], &bytes[7]) == 11) 
    {
        winrt::guid g;
        g.Data1 = d1;
        g.Data2 = static_cast<uint16_t>(d2);
        g.Data3 = static_cast<uint16_t>(d3);
        for (int i = 0; i < 8; ++i) {
            g.Data4[i] = static_cast<uint8_t>(bytes[i]);
        }
        return g;
    }
    // Try without dashes (just in case)
    if (sscanf_s(str.c_str(), "%8lx%4x%4x%2x%2x%2x%2x%2x%2x%2x%2x",
        &d1, &d2, &d3,
        &bytes[0], &bytes[1], &bytes[2], &bytes[3],
        &bytes[4], &bytes[5], &bytes[6], &bytes[7]) == 11) 
    {
        winrt::guid g;
        g.Data1 = d1;
        g.Data2 = static_cast<uint16_t>(d2);
        g.Data3 = static_cast<uint16_t>(d3);
        for (int i = 0; i < 8; ++i) {
            g.Data4[i] = static_cast<uint8_t>(bytes[i]);
        }
        return g;
    }
    throw std::invalid_argument("Invalid UUID format");
}

// Global configurations
std::string target_service_uuid;
std::string target_char_uuid;
std::string session_id;

// Reassembly buffer
std::mutex buffer_mutex;
std::vector<std::string> incoming_chunks;
int expected_chunks = -1;

// Notification queue
std::mutex queue_mutex;
std::condition_variable queue_cv;
std::queue<std::string> notification_queue;
bool should_exit = false;

// Splits string by delimiter
std::vector<std::string> split(const std::string& s, char delimiter) {
    std::vector<std::string> tokens;
    std::string token;
    std::istringstream tokenStream(s);
    while (std::getline(tokenStream, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

// Replaces all occurrences of a substring
std::string replace_all(std::string str, const std::string& from, const std::string& to) {
    size_t start_pos = 0;
    while((start_pos = str.find(from, start_pos)) != std::string::npos) {
        str.replace(start_pos, from.length(), to);
        start_pos += to.length();
    }
    return str;
}

// Handles incoming BLE write packets
void handle_write(const std::string& text) {
    std::lock_guard<std::mutex> lock(buffer_mutex);
    
    // Split message by colon
    std::vector<std::string> parts = split(text, ':');
    if (parts.empty()) return;
    
    std::string msg_type = parts[0];
    
    if (msg_type == "START") {
        // START:<session_id>:<total_chunks>
        if (parts.size() >= 3) {
            std::string sess = parts[1];
            if (sess == session_id) {
                expected_chunks = std::stoi(parts[2]);
                incoming_chunks.clear();
                incoming_chunks.resize(expected_chunks, "");
                std::cout << "STATUS:CONNECTED" << std::endl << std::flush;
            }
        }
    }
    else if (msg_type == "CHUNK") {
        // CHUNK:<session_id>:<index>:<payload>
        if (parts.size() >= 4) {
            std::string sess = parts[1];
            if (sess == session_id) {
                int index = std::stoi(parts[2]);
                
                // Reconstruct payload that might contain colons
                std::string prefix = "CHUNK:" + sess + ":" + std::to_string(index) + ":";
                if (text.length() > prefix.length()) {
                    std::string payload = text.substr(prefix.length());
                    if (index >= 0 && index < expected_chunks) {
                        incoming_chunks[index] = payload;
                    }
                }
            }
        }
    }
    else if (msg_type == "END") {
        // END:<session_id>
        if (parts.size() >= 2) {
            std::string sess = parts[1];
            if (sess == session_id) {
                bool complete = true;
                for (const auto& chunk : incoming_chunks) {
                    if (chunk.empty()) {
                        complete = false;
                        break;
                    }
                }
                
                if (expected_chunks > 0 && complete) {
                    std::ostringstream sdp_builder;
                    for (const auto& chunk : incoming_chunks) {
                        sdp_builder << chunk;
                    }
                    std::string assembled_sdp = sdp_builder.str();
                    
                    // Escape newlines as \n to keep stdout message on one line
                    std::string escaped_sdp = replace_all(assembled_sdp, "\r\n", "\\n");
                    escaped_sdp = replace_all(escaped_sdp, "\n", "\\n");
                    escaped_sdp = replace_all(escaped_sdp, "\r", "\\r");
                    
                    std::cout << "SDP:OFFER:" << escaped_sdp << std::endl << std::flush;
                }
            }
        }
    }
    else if (msg_type == "ICE") {
        // ICE:<session_id>:<sdpMid>:<sdpMLineIndex>:<candidate>
        if (parts.size() >= 5) {
            std::string sess = parts[1];
            if (sess == session_id) {
                std::string sdp_mid = parts[2];
                std::string sdp_mline_index = parts[3];
                std::string prefix = "ICE:" + sess + ":" + sdp_mid + ":" + sdp_mline_index + ":";
                if (text.length() > prefix.length()) {
                    std::string candidate = text.substr(prefix.length());
                    std::cout << "ICE:" << sdp_mid << ":" << sdp_mline_index << ":" << candidate << std::endl << std::flush;
                }
            }
        }
    }
    else if (msg_type == "LOG") {
        // LOG:<session_id>:<log_message>
        if (parts.size() >= 3) {
            std::string sess = parts[1];
            if (sess == session_id) {
                std::string prefix = "LOG:" + sess + ":";
                if (text.length() > prefix.length()) {
                    std::string log_msg = text.substr(prefix.length());
                    std::cout << "PHONE_LOG:" << log_msg << std::endl << std::flush;
                }
            }
        }
    }
}

// Notification worker thread function (paces output to avoid packet drops)
void notification_worker(GattLocalCharacteristic characteristic) {
    while (true) {
        std::string message;
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            queue_cv.wait(lock, [] { return !notification_queue.empty() || should_exit; });
            
            if (should_exit && notification_queue.empty()) {
                break;
            }
            
            message = notification_queue.front();
            notification_queue.pop();
        }
        
        try {
            DataWriter writer;
            writer.UnicodeEncoding(UnicodeEncoding::Utf8);
            
            // Convert C++ string to hstring (UTF-16) and write as UTF-8 bytes to buffer
            writer.WriteString(winrt::to_hstring(message));
            IBuffer buffer = writer.DetachBuffer();
            
            // Notify connected client characteristic value changed
            characteristic.NotifyValueAsync(buffer).get();
        }
        catch (winrt::hresult_error const& ex) {
            std::cerr << "Failed to send BLE notification: " << winrt::to_string(ex.message()) << std::endl;
        }
        
        // Pace notifications with 15ms sleep
        std::this_thread::sleep_for(std::chrono::milliseconds(15));
    }
}

// Queues a notification message
void queue_notification(const std::string& message) {
    std::lock_guard<std::mutex> lock(queue_mutex);
    notification_queue.push(message);
    queue_cv.notify_one();
}

int main(int argc, char* argv[]) {
    // Initialize Windows Runtime
    init_apartment();
    
    if (argc < 4) {
        std::cerr << "Usage: ble_signaling_server <service_uuid> <char_uuid> <session_id>" << std::endl;
        return 1;
    }
    
    target_service_uuid = argv[1];
    target_char_uuid = argv[2];
    session_id = argv[3];
    
    // Convert to lowercase
    std::transform(target_service_uuid.begin(), target_service_uuid.end(), target_service_uuid.begin(), ::tolower);
    std::transform(target_char_uuid.begin(), target_char_uuid.end(), target_char_uuid.begin(), ::tolower);
    
    try {
        // 1. Get default Bluetooth adapter MAC address
        auto adapter = BluetoothAdapter::GetDefaultAsync().get();
        if (!adapter) {
            std::cout << "ERROR:NO_ADAPTER" << std::endl << std::flush;
            std::cerr << "No Bluetooth adapter detected." << std::endl;
            return 1;
        }
        
        if (!adapter.IsLowEnergySupported()) {
            std::cerr << "Warning: Adapter reports IsLowEnergySupported = false." << std::endl;
        }
        
        uint64_t mac_address = adapter.BluetoothAddress();
        std::ostringstream mac_stream;
        for (int i = 40; i >= 0; i -= 8) {
            int part = (mac_address >> i) & 0xff;
            mac_stream << std::hex << std::uppercase << std::setw(2) << std::setfill('0') << part;
            if (i > 0) mac_stream << ":";
        }
        std::cout << "MAC:" << mac_stream.str() << std::endl << std::flush;
        
        // 2. Setup BLE GATT Service Provider with Retry Mechanism (handles transient resource locks)
        winrt::guid service_guid = parse_uuid(target_service_uuid);
        GattServiceProviderResult serviceResult{ nullptr };
        for (int attempt = 1; attempt <= 3; ++attempt) {
            try {
                serviceResult = GattServiceProvider::CreateAsync(service_guid).get();
                if (serviceResult && serviceResult.Error() == BluetoothError::Success) {
                    break;
                }
                std::cerr << "GattServiceProvider::CreateAsync attempt " << attempt << " returned error. Retrying in 500ms..." << std::endl;
            }
            catch (winrt::hresult_error const& ex) {
                std::cerr << "GattServiceProvider::CreateAsync attempt " << attempt << " exception: " << winrt::to_string(ex.message()) << ". Retrying in 500ms..." << std::endl;
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
        
        if (!serviceResult || serviceResult.Error() != BluetoothError::Success) {
            std::cout << "ERROR:SERVICE_PROVIDER_FAILED" << std::endl << std::flush;
            std::cerr << "Failed to create service provider after multiple attempts." << std::endl;
            return 1;
        }
        
        auto provider = serviceResult.ServiceProvider();
        auto service = provider.Service();
        
        // 3. Setup BLE GATT Characteristic with Property Fallbacks (handles driver restrictions)
        winrt::guid char_guid = parse_uuid(target_char_uuid);
        GattLocalCharacteristicResult charResult{ nullptr };
        
        // Attempt 1: Full properties (Read | Write | WriteWithoutResponse | Notify)
        try {
            GattLocalCharacteristicParameters charParams;
            charParams.CharacteristicProperties(
                GattCharacteristicProperties::Read |
                GattCharacteristicProperties::Write |
                GattCharacteristicProperties::WriteWithoutResponse |
                GattCharacteristicProperties::Notify
            );
            charParams.WriteProtectionLevel(GattProtectionLevel::Plain);
            charParams.ReadProtectionLevel(GattProtectionLevel::Plain);
            charResult = service.CreateCharacteristicAsync(char_guid, charParams).get();
        }
        catch (...) {}
        
        // Attempt 2 Fallback: If failed, try classic properties (Read | Write | Notify) without WriteWithoutResponse
        if (!charResult || charResult.Error() != BluetoothError::Success) {
            try {
                std::cerr << "Notice: Falling back to standard GattCharacteristicProperties (Read | Write | Notify)..." << std::endl;
                GattLocalCharacteristicParameters charParams;
                charParams.CharacteristicProperties(
                    GattCharacteristicProperties::Read |
                    GattCharacteristicProperties::Write |
                    GattCharacteristicProperties::Notify
                );
                charParams.WriteProtectionLevel(GattProtectionLevel::Plain);
                charParams.ReadProtectionLevel(GattProtectionLevel::Plain);
                charResult = service.CreateCharacteristicAsync(char_guid, charParams).get();
            }
            catch (...) {}
        }
        
        if (!charResult || charResult.Error() != BluetoothError::Success) {
            std::cout << "ERROR:CHARACTERISTIC_FAILED" << std::endl << std::flush;
            std::cerr << "Failed to create characteristic after fallback." << std::endl;
            return 1;
        }
        
        auto characteristic = charResult.Characteristic();
        
        // Register write request handler
        characteristic.WriteRequested([](GattLocalCharacteristic const& sender, GattWriteRequestedEventArgs const& args) {
            auto deferral = args.GetDeferral();
            
            try {
                auto request = args.GetRequestAsync().get();
                auto value = request.Value();
                
                // Parse UTF-8 string from written buffer
                auto reader = DataReader::FromBuffer(value);
                std::vector<uint8_t> bytes(reader.UnconsumedBufferLength());
                reader.ReadBytes(bytes);
                std::string text(bytes.begin(), bytes.end());
                
                handle_write(text);
                
                if (request.Option() == GattWriteOption::WriteWithResponse) {
                    request.Respond();
                }
            }
            catch (std::exception const& e) {
                std::cerr << "Exception in write handler: " << e.what() << std::endl;
            }
            
            deferral.Complete();
        });
        
        // Register read request handler
        characteristic.ReadRequested([](GattLocalCharacteristic const& sender, GattReadRequestedEventArgs const& args) {
            auto deferral = args.GetDeferral();
            try {
                auto request = args.GetRequestAsync().get();
                DataWriter writer;
                writer.WriteByte(0);
                request.RespondWithValue(writer.DetachBuffer());
            }
            catch (std::exception const& e) {
                std::cerr << "Exception in read handler: " << e.what() << std::endl;
            }
            deferral.Complete();
        });
        
        // 4. Start Advertising with Fallback
        bool advStarted = false;
        try {
            GattServiceProviderAdvertisingParameters advParams;
            advParams.IsDiscoverable(true);
            advParams.IsConnectable(true);
            provider.StartAdvertising(advParams);
            advStarted = true;
        }
        catch (winrt::hresult_error const& ex) {
            std::cerr << "Notice: StartAdvertising with parameters failed: " << winrt::to_string(ex.message()) << ". Trying default StartAdvertising..." << std::endl;
        }
        
        if (!advStarted) {
            try {
                provider.StartAdvertising();
                advStarted = true;
            }
            catch (winrt::hresult_error const& ex) {
                std::cout << "ERROR:ADVERTISING_FAILED" << std::endl << std::flush;
                std::cerr << "Failed to start BLE advertising: " << winrt::to_string(ex.message()) << std::endl;
                return 1;
            }
        }
        
        std::cout << "STATUS:ADVERTISING" << std::endl << std::flush;
        
        // 5. Start Notification worker thread
        std::thread worker(notification_worker, characteristic);
        
        // 6. Stdin command loop
        std::string line;
        while (std::getline(std::cin, line)) {
            if (line.empty()) continue;
            
            size_t colon_pos = line.find(':');
            if (colon_pos == std::string::npos) continue;
            
            std::string cmd_type = line.substr(0, colon_pos);
            std::string payload = line.substr(colon_pos + 1);
            
            if (cmd_type == "ANSWER") {
                // Unescape newlines
                std::string sdp = replace_all(payload, "\\n", "\n");
                sdp = replace_all(sdp, "\\r", "\r");
                
                // Segment SDP into 250-byte chunks
                const size_t chunk_size = 250;
                std::vector<std::string> chunks;
                for (size_t i = 0; i < sdp.length(); i += chunk_size) {
                    chunks.push_back(sdp.substr(i, chunk_size));
                }
                
                // Send START
                queue_notification("START:" + session_id + ":" + std::to_string(chunks.size()));
                
                // Send CHUNKS
                for (size_t idx = 0; idx < chunks.size(); ++idx) {
                    queue_notification("CHUNK:" + session_id + ":" + std::to_string(idx) + ":" + chunks[idx]);
                }
                
                // Send END
                queue_notification("END:" + session_id);
            }
            else if (cmd_type == "ICE") {
                // payload: sdpMid:sdpMLineIndex:candidate_string
                std::vector<std::string> ice_parts = split(payload, ':');
                if (ice_parts.size() >= 3) {
                    std::string sdp_mid = ice_parts[0];
                    std::string sdp_mline_index = ice_parts[1];
                    
                    std::string prefix = sdp_mid + ":" + sdp_mline_index + ":";
                    std::string candidate = payload.substr(prefix.length());
                    
                    std::string msg = "ICE:" + session_id + ":" + sdp_mid + ":" + sdp_mline_index + ":" + candidate;
                    queue_notification(msg);
                }
            }
        }
        
        // Cleanup worker thread
        {
            std::lock_guard<std::mutex> lock(queue_mutex);
            should_exit = true;
            queue_cv.notify_one();
        }
        if (worker.joinable()) {
            worker.join();
        }
        
        // Stop BLE Advertising
        provider.StopAdvertising();
    }
    catch (winrt::hresult_error const& ex) {
        std::cerr << "C++/WinRT Exception: " << winrt::to_string(ex.message()) << " (Code: " << std::hex << ex.to_abi() << ")" << std::endl;
        return 1;
    }
    catch (std::exception const& ex) {
        std::cerr << "Std Exception: " << ex.what() << std::endl;
        return 1;
    }
    
    return 0;
}
