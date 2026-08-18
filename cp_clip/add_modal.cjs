const fs = require('fs');
let c = fs.readFileSync('src/App.vue', 'utf-8');

// 1. Add custom confirm modal before </div> closing the app-container (insert after title bar closing div)
const afterTitleBar = `    </div>

    <!-- Main App Body -->`;

const modalHTML = `    </div>

    <!-- Custom Confirm Modal -->
    <Transition name="modal-fade">
      <div v-if="confirmModal.visible" style="position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);" @click.self="confirmModal.onCancel && confirmModal.onCancel()">
        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 28px 32px; max-width: 420px; width: 90%; box-shadow: 0 25px 60px rgba(0,0,0,0.5); animation: modalSlideIn 0.2s ease-out;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1)); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">{{ confirmModal.icon || '⚠️' }}</div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">{{ confirmModal.title || '确认操作' }}</h3>
          </div>
          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.7; color: var(--text-secondary); white-space: pre-line;">{{ confirmModal.message }}</p>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button @click="confirmModal.onCancel && confirmModal.onCancel(); confirmModal.visible = false" style="padding: 8px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.07); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;" @mouseenter="$event.target.style.background='rgba(255,255,255,0.12)'" @mouseleave="$event.target.style.background='rgba(255,255,255,0.07)'">取消</button>
            <button @click="confirmModal.onConfirm && confirmModal.onConfirm(); confirmModal.visible = false" :style="'padding: 8px 20px; border-radius: 8px; border: none; background: ' + (confirmModal.danger ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #a855f7, #7c3aed)') + '; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 12px rgba(0,0,0,0.3);'">{{ confirmModal.confirmText || '确定' }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main App Body -->`;

c = c.replace(afterTitleBar, modalHTML);

// 2. Replace handleRecalculateFaces function to use custom modal
const oldFunc = `async function handleRecalculateFaces() {
  if (!confirm('确定要清空所有人脸识别记录，并强制对全部图片重新进行人脸提取吗？\\n如果图片较多，可能需要几分钟时间。')) return;
  if (!hasApi || !window.api.recalculateAllFaces) return;
  
  isClusteringPeople.value = true;
  faceScanProgress.value = { done: 0, total: 0 };
  try {
    const clusters = await window.api.recalculateAllFaces();
    personClusters.value = clusters;
    if (clusters.length > 0) {
      selectPerson(clusters[0]);
    } else {
      selectedPerson.value = null;
    }
    alert('强制重新提取人脸完成！');
  } catch (e) {
    console.error('[People] Failed to recalculate faces:', e);
    alert('重新提取失败: ' + e.message);
  } finally {
    isClusteringPeople.value = false;
  }
}`;

const newFunc = `async function handleRecalculateFaces() {
  if (!hasApi || !window.api.recalculateAllFaces) return;
  showConfirm({
    icon: '♻️',
    title: '强制重新提取人脸',
    message: '确定要清空所有人脸识别记录，并对全部图片重新进行人脸提取吗？\\n如果图片较多，可能需要几分钟时间。',
    confirmText: '开始重新提取',
    danger: false,
    onConfirm: async () => {
      isClusteringPeople.value = true;
      faceScanProgress.value = { done: 0, total: 0 };
      try {
        const clusters = await window.api.recalculateAllFaces();
        personClusters.value = clusters;
        if (clusters.length > 0) {
          selectPerson(clusters[0]);
        } else {
          selectedPerson.value = null;
        }
      } catch (e) {
        console.error('[People] Failed to recalculate faces:', e);
      } finally {
        isClusteringPeople.value = false;
      }
    }
  });
}`;

c = c.replace(oldFunc, newFunc);

// 3. Add confirmModal reactive state and showConfirm helper near other refs
// Find const isClusteringPeople = ref(false); and add after it
const refTarget = 'const isClusteringPeople = ref(false);';
const refReplacement = `const isClusteringPeople = ref(false);
const confirmModal = ref({ visible: false, icon: '⚠️', title: '', message: '', confirmText: '确定', danger: false, onConfirm: null, onCancel: null });

function showConfirm({ icon, title, message, confirmText, danger, onConfirm, onCancel } = {}) {
  confirmModal.value = { visible: true, icon: icon || '⚠️', title: title || '确认', message, confirmText: confirmText || '确定', danger: !!danger, onConfirm: onConfirm || null, onCancel: onCancel || null };
}`;

c = c.replace(refTarget, refReplacement);

// 4. Add CSS animation for modal
const styleTarget = `</style>`;
const styleReplacement = `
@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.92) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>`;
// Only replace the LAST </style>
const lastStyleIdx = c.lastIndexOf(styleTarget);
c = c.slice(0, lastStyleIdx) + styleReplacement + c.slice(lastStyleIdx + styleTarget.length);

fs.writeFileSync('src/App.vue', c);
console.log('Done!');
