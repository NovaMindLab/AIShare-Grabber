const cp = require('child_process');
const ytPath = require('path').join(__dirname, '..', '..', '..', 'AppData', 'Roaming', 'ShareCLIP', 'bin', 'yt-dlp.exe'); // Path depends on app.getPath('userData'), let's assume it downloaded.

// Let's just download yt-dlp first or run it if it exists.
const fs = require('fs');
const os = require('os');

const appData = path.join(os.homedir(), 'AppData', 'Roaming', 'ShareCLIP', 'bin', 'yt-dlp.exe');

if (!fs.existsSync(appData)) {
    console.log("yt-dlp not found at", appData);
}

const child = cp.spawn(appData, ['-J', '--no-playlist', 'https://www.youtube.com/watch?v=jNQXAC9IVRw']);
let output = '';
let errOut = '';
child.stdout.on('data', d => output += d.toString());
child.stderr.on('data', d => errOut += d.toString());

child.on('close', code => {
    console.log('Code:', code);
    console.log('Err:', errOut);
    try {
        const json = JSON.parse(output);
        console.log('Title:', json.title);
        console.log('Formats:', json.formats.length);
    } catch (e) {
        console.log('Parse error', e);
        console.log('Output preview:', output.substring(0, 500));
    }
});
