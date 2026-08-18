const fs = require('fs');
let c = fs.readFileSync('src/App.vue', 'utf-8');

const lines = c.split('\n');

// Lines 1078-1088 (0-indexed: 1077-1087) need to be replaced
// Replace the single button + closing div with a flex wrapper containing two buttons
const newLines = [
  '                <div style="display: flex; gap: 8px;">\r',
  '                  <button \r',
  '                    class="btn" \r',
  '                    @click="handleRecalculateFaces" \r',
  '                    :disabled="isClusteringPeople"\r',
  '                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-primary); cursor: pointer;"\r',
  '                  >\r',
  '                    <span v-if="isClusteringPeople" class="spinner" style="width: 12px; height: 12px; border-color: var(--text-primary); border-top-color: transparent;"></span>\r',
  '                    <span v-else>\u267b\ufe0f</span>\r',
  '                    <span>\u5f3a\u5236\u91cd\u65b0\u63d0\u53d6\u4eba\u8138</span>\r',
  '                  </button>\r',
  '                  <button \r',
  '                    class="btn btn-primary" \r',
  '                    @click="handleReclusterPeople" \r',
  '                    :disabled="isClusteringPeople"\r',
  '                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #7c3aed); cursor: pointer;"\r',
  '                  >\r',
  '                    <span v-if="isClusteringPeople" class="spinner" style="width: 12px; height: 12px;"></span>\r',
  '                    <span v-else>\ud83d\udd04</span>\r',
  "                    <span>{{ isClusteringPeople ? (faceScanProgress.total > 0 && faceScanProgress.done < faceScanProgress.total ? '\u63d0\u53d6\u4eba\u8138\u4e2d (' + faceScanProgress.done + '/' + faceScanProgress.total + ')' : '\u8ba1\u7b97\u805a\u7c7b\u4e2d...') : '\u5237\u65b0\u805a\u7c7b' }}</span>\r",
  '                  </button>\r',
  '                </div>\r',
  '              </div>\r',
];

// Remove lines 1078-1088 (0-indexed: 1077 to 1087 inclusive = 11 lines)
lines.splice(1077, 11, ...newLines);

fs.writeFileSync('src/App.vue', lines.join('\n'));
console.log('Done! Total lines now: ' + lines.length);
