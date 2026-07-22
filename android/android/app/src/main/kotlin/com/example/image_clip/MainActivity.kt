package com.example.image_clip

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager
import android.net.wifi.WifiNetworkSpecifier
import android.net.wifi.WifiNetworkSuggestion
import android.os.Build
import android.os.Environment
import android.os.StatFs
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.shareclip/system_info"
    private var downloadId: Long = -1

    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
            if (id == downloadId) {
                val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                val uri = downloadManager.getUriForDownloadedFile(downloadId)
                if (uri != null) {
                    val installIntent = Intent(Intent.ACTION_VIEW)
                    installIntent.setDataAndType(uri, "application/vnd.android.package-archive")
                    installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    try {
                        context.startActivity(installIntent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                try {
                    context.unregisterReceiver(this)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "getSystemInfo") {
                val path = Environment.getDataDirectory()
                val stat = StatFs(path.path)
                val blockSize = stat.blockSizeLong
                val totalBlocks = stat.blockCountLong
                val availableBlocks = stat.availableBlocksLong

                val totalBytes = totalBlocks * blockSize
                val freeBytes = availableBlocks * blockSize
                val usedBytes = totalBytes - freeBytes

                val info = mapOf(
                    "os" to "Android",
                    "version" to Build.VERSION.RELEASE,
                    "model" to Build.MODEL,
                    "brand" to Build.BRAND,
                    "total_storage" to totalBytes,
                    "free_storage" to freeBytes,
                    "used_storage" to usedBytes
                )
                result.success(info)
            } else if (call.method == "openUrl") {
                val url = call.argument<String>("url")
                if (url != null) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(intent)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("ERROR", e.message, null)
                    }
                } else {
                    result.error("BAD_ARGS", "Missing url parameter", null)
                }
            } else if (call.method == "downloadAndInstallApk") {
                val url = call.argument<String>("url")
                if (url != null) {
                    try {
                        val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                        val request = DownloadManager.Request(Uri.parse(url))
                        request.setTitle("ShareCLIP Update")
                        request.setDescription("Downloading latest version...")
                        request.setMimeType("application/vnd.android.package-archive")
                        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "ShareCLIP_Update.apk")
                        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            registerReceiver(downloadReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED)
                        } else {
                            registerReceiver(downloadReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
                        }
                        
                        downloadId = downloadManager.enqueue(request)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("ERROR", e.message, null)
                    }
                } else {
                    result.error("BAD_ARGS", "Missing url parameter", null)
                }
            } else if (call.method == "getDownloadProgress") {
                if (downloadId != -1L) {
                    val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    val query = DownloadManager.Query().setFilterById(downloadId)
                    val cursor = downloadManager.query(query)
                    if (cursor != null && cursor.moveToFirst()) {
                        val statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                        val status = cursor.getInt(statusIndex)
                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            result.success(1.0)
                        } else if (status == DownloadManager.STATUS_FAILED) {
                            result.success(-1.0)
                        } else {
                            val bytesDownloadedIndex = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
                            val bytesTotalIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
                            if (bytesDownloadedIndex != -1 && bytesTotalIndex != -1) {
                                val bytesDownloaded = cursor.getInt(bytesDownloadedIndex)
                                val bytesTotal = cursor.getInt(bytesTotalIndex)
                                if (bytesTotal > 0) {
                                    result.success(bytesDownloaded.toDouble() / bytesTotal.toDouble())
                                } else {
                                    result.success(0.0)
                                }
                            } else {
                                result.success(0.0)
                            }
                        }
                        cursor.close()
                    } else {
                        result.success(-1.0)
                    }
                } else {
                    result.success(-1.0)
                }
            } else if (call.method == "installDownloadedApk") {
                if (downloadId != -1L) {
                    val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    val uri = downloadManager.getUriForDownloadedFile(downloadId)
                    if (uri != null) {
                        val installIntent = Intent(Intent.ACTION_VIEW)
                        installIntent.setDataAndType(uri, "application/vnd.android.package-archive")
                        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        try {
                            context.startActivity(installIntent)
                            result.success(true)
                        } catch (e: Exception) {
                            result.error("ERROR", "Failed to start install activity: ${e.message}", null)
                        }
                    } else {
                        result.error("ERROR", "Downloaded file URI is null", null)
                    }
                } else {
                    result.error("ERROR", "No active download", null)
                }
            } else if (call.method == "connectWifiSilent") {
                val ssid = call.argument<String>("ssid")
                val password = call.argument<String>("password")
                if (ssid != null && password != null) {
                    connectWifiSilent(ssid, password, result)
                } else {
                    result.error("BAD_ARGS", "Missing ssid or password", null)
                }
            } else if (call.method == "disconnectWifiSilent") {
                disconnectWifiSilent(result)
            } else {
                result.notImplemented()
            }
        }
    }

    private var currentNetworkCallback: ConnectivityManager.NetworkCallback? = null

    private fun connectWifiSilent(ssid: String, password: String, result: MethodChannel.Result) {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

        currentNetworkCallback?.let {
            try { connectivityManager.unregisterNetworkCallback(it) } catch (_: Exception) {}
            currentNetworkCallback = null
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val specifier = WifiNetworkSpecifier.Builder()
                    .setSsid(ssid)
                    .setWpa2Passphrase(password)
                    .build()

                val request = NetworkRequest.Builder()
                    .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                    .removeCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .setNetworkSpecifier(specifier)
                    .build()

                val callback = object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        try {
                            connectivityManager.bindProcessToNetwork(network)
                        } catch (_: Exception) {}
                        result.success(true)
                    }

                    override fun onUnavailable() {
                        trySuggestNetwork(ssid, password, wifiManager, result)
                    }
                }

                currentNetworkCallback = callback
                connectivityManager.requestNetwork(request, callback, 8000)

            } catch (e: Exception) {
                trySuggestNetwork(ssid, password, wifiManager, result)
            }
        } else {
            try {
                @Suppress("DEPRECATION")
                val wifiConfig = WifiConfiguration().apply {
                    SSID = "\"$ssid\""
                    preSharedKey = "\"$password\""
                }
                @Suppress("DEPRECATION")
                val netId = wifiManager.addNetwork(wifiConfig)
                if (netId != -1) {
                    @Suppress("DEPRECATION")
                    wifiManager.disconnect()
                    @Suppress("DEPRECATION")
                    wifiManager.enableNetwork(netId, true)
                    @Suppress("DEPRECATION")
                    wifiManager.reconnect()
                    result.success(true)
                } else {
                    result.success(false)
                }
            } catch (e: Exception) {
                result.error("ERROR", e.message, null)
            }
        }
    }

    private fun trySuggestNetwork(ssid: String, password: String, wifiManager: WifiManager, result: MethodChannel.Result) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val suggestion = WifiNetworkSuggestion.Builder()
                    .setSsid(ssid)
                    .setWpa2Passphrase(password)
                    .setIsAppInteractionRequired(false)
                    .build()
                val status = wifiManager.addNetworkSuggestions(listOf(suggestion))
                result.success(status == WifiManager.STATUS_NETWORK_SUGGESTIONS_SUCCESS)
            } catch (e: Exception) {
                result.error("ERROR", e.message, null)
            }
        } else {
            result.success(false)
        }
    }

    private fun disconnectWifiSilent(result: MethodChannel.Result) {
        try {
            currentNetworkCallback?.let {
                val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                connectivityManager.unregisterNetworkCallback(it)
                currentNetworkCallback = null
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                connectivityManager.bindProcessToNetwork(null)
            }
            result.success(true)
        } catch (e: Exception) {
            result.error("ERROR", e.message, null)
        }
    }
}
