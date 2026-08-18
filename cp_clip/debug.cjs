const fs = require('fs');
let c = fs.readFileSync('src/App.vue', 'utf-8');

const lines = c.split('\n');
// Print lines 1077-1092 to see exact content
for (let i = 1077; i <= 1092; i++) {
  process.stdout.write(i + ': ' + JSON.stringify(lines[i]) + '\n');
}
