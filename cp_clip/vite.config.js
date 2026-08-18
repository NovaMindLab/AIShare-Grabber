import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // Ensures assets are loaded with relative paths in production
  optimizeDeps: {
    include: ['vue', '@vueuse/core', 'qrcode']
  },
  server: {
    hmr: {
      overlay: false
    }
  }
})
