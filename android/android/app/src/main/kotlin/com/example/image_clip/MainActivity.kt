package com.example.image_clip

import android.os.Build
import android.os.Environment
import android.os.StatFs
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.shareclip/system_info"

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
                        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(intent)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("ERROR", e.message, null)
                    }
                } else {
                    result.error("BAD_ARGS", "Missing url parameter", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }
}
