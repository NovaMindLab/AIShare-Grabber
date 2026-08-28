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
import androidx.core.content.FileProvider
import android.provider.Settings
import java.io.File

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.shareclip/system_info"

    private fun installApkAtPath(filePath: String): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.packageManager.canRequestPackageInstalls()) {
                    val permIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(permIntent)
                    return false
                }
            }

            val apkFile = File(filePath)
            if (apkFile.exists() && apkFile.length() > 0) {
                val contentUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apkFile)
                val installIntent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(contentUri, "application/vnd.android.package-archive")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                context.startActivity(installIntent)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
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
            } else if (call.method == "getAppCacheDir") {
                val dir = context.externalCacheDir ?: context.cacheDir
                result.success(dir.absolutePath)
            } else if (call.method == "installApk") {
                val path = call.argument<String>("path")
                if (path != null) {
                    val success = installApkAtPath(path)
                    if (success) {
                        result.success(true)
                    } else {
                        result.error("ERROR", "Failed to start install activity", null)
                    }
                } else {
                    result.error("BAD_ARGS", "Missing path parameter", null)
                }
            } else if (call.method == "installDownloadedApk") {
                val targetDir = context.externalCacheDir ?: context.cacheDir
                val apkFile = File(targetDir, "ShareCLIP_Update.apk")
                val success = installApkAtPath(apkFile.absolutePath)
                if (success) {
                    result.success(true)
                } else {
                    result.error("ERROR", "Failed to start APK installation", null)
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
            } else if (call.method == "setKeepScreenOn") {
                val enabled = call.argument<Boolean>("enabled") ?: false
                runOnUiThread {
                    if (enabled) {
                        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    } else {
                        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    }
                }
                result.success(true)
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
