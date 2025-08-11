import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://pangcah-accounting-system-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})