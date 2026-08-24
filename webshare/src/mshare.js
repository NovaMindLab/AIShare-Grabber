import { createApp } from 'vue';
import MShare from './MShare.vue';
import './styles/main.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('✅ MShare PWA Service Worker active:', reg.scope))
      .catch((err) => console.log('ℹ️ Service Worker notice:', err));
  });
}

const app = createApp(MShare);
app.mount('#app');
