const fs = require('fs');
let c = fs.readFileSync('src/App.vue', 'utf-8');

// 1. Insert modal HTML before "<!-- Main App Body -->"
const mainBodyMarker = '    <!-- Main App Body -->';
if (!c.includes('confirmModal.visible')) {
  const modalHtml = `    <!-- Custom Confirm Modal -->
    <Transition name="modal-fade">
      <div v-if="confirmModal.visible" style="position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);" @click.self="confirmModal.visible = false">
        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 28px 32px; max-width: 420px; width: 90%; box-shadow: 0 25px 60px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(168,85,247,0.15); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">{{ confirmModal.icon }}</div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">{{ confirmModal.title }}</h3>
          </div>
          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.7; color: var(--text-secondary); white-space: pre-line;">{{ confirmModal.message }}</p>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button @click="confirmModal.visible = false" style="padding: 8px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.07); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;">取消</button>
            <button @click="confirmModal.onConfirm && confirmModal.onConfirm(); confirmModal.visible = false" style="padding: 8px 20px; border-radius: 8px; border: none; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(168,85,247,0.4);">{{ confirmModal.confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>

    `;
  c = c.replace(mainBodyMarker, modalHtml + mainBodyMarker);
  console.log('Modal HTML inserted');
} else {
  console.log('Modal HTML already present');
}

// 2. Add CSS animation before </style>
if (!c.includes('modalSlideIn')) {
  c = c.replace('</style>', `
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>`);
  console.log('CSS added');
} else {
  console.log('CSS already present');
}

fs.writeFileSync('src/App.vue', c);
console.log('Done!');
