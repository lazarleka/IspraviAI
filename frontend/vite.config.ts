import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Local preview uses :8001 because another project is already using :8000.
    proxy: {
      '/api': { target: 'http://localhost:8001', changeOrigin: true, ws: true },
    },
  },
})
