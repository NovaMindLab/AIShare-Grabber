const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

async function testDB() {
  const syncDir = path.join(process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.config"), 'cp_clip', 'sync_storage');
  if (!fs.existsSync(syncDir)) {
    console.log("No sync_storage found at", syncDir);
    return;
  }
  const devices = fs.readdirSync(syncDir).filter(d => fs.statSync(path.join(syncDir, d)).isDirectory());
  if (devices.length === 0) {
    console.log("No devices found.");
    return;
  }
  
  const dbPath = path.join(syncDir, devices[0], 'database.sqlite');
  console.log("Checking DB:", dbPath);
  if (!fs.existsSync(dbPath)) return;

  const db = new sqlite3.Database(dbPath);
  db.all("SELECT id, path, embedding FROM resources WHERE embedding IS NOT NULL LIMIT 2", (err, rows) => {
    if (err) console.error(err);
    else {
      console.log(`Found ${rows.length} rows with embeddings.`);
      rows.forEach(r => {
        console.log(`Path: ${r.path}`);
        if (r.embedding) {
          const arr = new Float32Array(r.embedding.buffer, r.embedding.byteOffset, r.embedding.byteLength / 4);
          console.log(`Embedding valid. Length: ${arr.length}, First val: ${arr[0]}`);
        }
      });
    }
  });
}
testDB();
