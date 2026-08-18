const fs = require('fs');
const path = require('path');

const vueFile = path.join(__dirname, 'cp_clip', 'src', 'App.vue');
let content = fs.readFileSync(vueFile, 'utf8');

// Replace { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
// with { iceServers: [] }
content = content.replace(/\{ urls: 'stun:stun\.l\.google\.com:19302' \}/g, '');
content = content.replace(/iceServers:\s*\[\s*\]/g, 'iceServers: []');

fs.writeFileSync(vueFile, content, 'utf8');
console.log('Fixed STUN servers in App.vue');
