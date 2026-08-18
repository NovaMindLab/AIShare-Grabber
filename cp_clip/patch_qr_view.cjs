const fs = require('fs');
let c = fs.readFileSync('../android/lib/views/qr_scanner_view.dart', 'utf-8');

// 1. Add import
if (!c.includes('../viewmodels/sync_viewmodel.dart')) {
  c = c.replace(
    "import '../services/localization_service.dart';",
    "import '../services/localization_service.dart';\nimport '../viewmodels/sync_viewmodel.dart';"
  );
}

// 2. Add the discovered PCs UI above the instruction banner
// Locate the Instruction Banner
const instructionBanner = `          // 3. Instruction Banner
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 80.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                decoration: BoxDecoration(
                  color: const Color(0x990F172A),
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: Text(
                  Provider.of<LocalizationService>(context).get('scannerBanner'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15.0,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),`;

const replacement = `          // 3. Discovered Devices & Instruction Banner
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 60.0),
              child: Consumer<SyncViewModel>(
                builder: (context, syncVm, child) {
                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Discovered PCs list
                      if (syncVm.discoveredPCs.isNotEmpty) ...[
                        Text(
                          '局域网可连接设�?(\${syncVm.discoveredPCs.length})',
                          style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 70,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: syncVm.discoveredPCs.length,
                            itemBuilder: (context, index) {
                              final pc = syncVm.discoveredPCs[index];
                              return GestureDetector(
                                onTap: () {
                                  syncVm.connectToPC(pc['ip'], pc['name']);
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('正在连接 \${pc['name']}... 请在电脑端同意连接请�?)));
                                },
                                child: Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 6),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.computer, color: Colors.white),
                                      const SizedBox(width: 8),
                                      Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(pc['name'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                          Text(pc['ip'], style: const TextStyle(color: Colors.white70, fontSize: 10)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      // Instruction Banner
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                        decoration: BoxDecoration(
                          color: const Color(0x990F172A),
                          borderRadius: BorderRadius.circular(12.0),
                        ),
                        child: Text(
                          Provider.of<LocalizationService>(context).get('scannerBanner'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15.0,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),`;

if (c.includes(instructionBanner)) {
  c = c.replace(instructionBanner, replacement);
  fs.writeFileSync('../android/lib/views/qr_scanner_view.dart', c);
  console.log('qr_scanner_view.dart patched successfully!');
} else {
  console.error('Target instruction banner not found');
}
