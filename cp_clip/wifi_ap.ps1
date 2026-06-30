param(
    [string]$SSID = "ShareCLIP_AP",
    [string]$Password = "12345678"
)

$ErrorActionPreference = "Stop"
$publisher = $null

# Define cleanup block
function Cleanup {
    Write-Host "STATUS: CLEANING_UP"
    if ($publisher -ne $null) {
        try {
            Write-Host "Stopping WiFiDirect publisher..."
            $publisher.Stop()
        } catch {}
    }
    try {
        # Fallback netsh stop just in case legacy hostednetwork was used
        netsh wlan stop hostednetwork > $null
    } catch {}
    Write-Host "STATUS: STOPPED"
}

# Trap termination to run cleanup
trap {
    Cleanup
    exit
}

try {
    # ── Method 1: WinRT WiFiDirect soft AP (Autonomous Group Owner) ──
    Write-Host "STATUS: TRYING_WIFIDIRECT"
    
    $publisherType = "Windows.Devices.WiFiDirect.WiFiDirectAdvertisementPublisher, Windows.Devices.WiFiDirect, ContentType=WindowsRuntime"
    $credType = "Windows.Security.Credentials.PasswordCredential, Windows.Security.Credentials, ContentType=WindowsRuntime"
    
    $publisher = New-Object $publisherType
    $publisher.Advertisement.IsAutonomousGroupOwnerEnabled = $true
    $publisher.Advertisement.LegacySettings.IsEnabled = $true
    $publisher.Advertisement.LegacySettings.Ssid = $SSID

    $cred = New-Object $credType
    $cred.Password = $Password
    $publisher.Advertisement.LegacySettings.Passphrase = $cred

    $publisher.Start()
    
    Start-Sleep -Seconds 1
    if ($publisher.Status -eq "Started") {
        Write-Host "STATUS: STARTED"
        Write-Host "SSID: $SSID"
        Write-Host "PASSWORD: $Password"
        Write-Host "METHOD: WIFIDIRECT"
        
        # Keep alive loop: wait for stdin "STOP" or process kill
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } else {
        throw "WiFiDirect operational state is $($publisher.Status)"
    }
} catch {
    Write-Host "STATUS: WIFIDIRECT_FAILED"
    Write-Host "ERROR: $_"
    
    # ── Method 2: UWP Mobile Hotspot Tethering Manager Fallback ──
    try {
        Write-Host "STATUS: TRYING_TETHERING"
        $netInfoType = "Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType=WindowsRuntime"
        $tetherType = "Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime"
        
        # Find any internet/network profile to bind tethering manager
        $profile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
        if ($profile -eq $null) {
            $profiles = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
            if ($profiles.Count -gt 0) {
                $profile = $profiles[0]
            }
        }
        
        if ($profile -eq $null) {
            throw "No network profile found to initialize Mobile Hotspot."
        }
        
        $tetherManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($profile)
        $tetherManager.StartTetheringAsync()
        
        Start-Sleep -Seconds 2
        Write-Host "STATUS: STARTED"
        Write-Host "METHOD: TETHERING"
        
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } catch {
        Write-Host "STATUS: TETHERING_FAILED"
        Write-Host "ERROR: $_"
        
        # ── Method 3: Legacy netsh hostednetwork Fallback ──
        try {
            Write-Host "STATUS: TRYING_NETSH"
            $modeResult = netsh wlan set hostednetwork mode=allow ssid=$SSID key=$Password
            $startResult = netsh wlan start hostednetwork
            
            if ($startResult -like "*started*" -or $startResult -like "*已启动*") {
                Write-Host "STATUS: STARTED"
                Write-Host "SSID: $SSID"
                Write-Host "PASSWORD: $Password"
                Write-Host "METHOD: NETSH"
                
                while ($true) {
                    Start-Sleep -Seconds 1
                }
            } else {
                throw "netsh start output: $startResult"
            }
        } catch {
            Write-Host "STATUS: FAILED"
            Write-Host "ERROR: All Wi-Fi hotspot start methods failed."
            Cleanup
        }
    }
}
