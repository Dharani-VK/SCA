import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Increase timeouts for large file uploads
    hmr: {
      timeout: 300000, // 5 minutes
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Increase proxy timeout for large file uploads
        timeout: 300000, // 5 minutes
        proxyTimeout: 300000, // 5 minutes
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
