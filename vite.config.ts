import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // SPA routing için tüm 404'leri index.html'e yönlendir
    historyApiFallback: true
  },
  resolve: {
    alias: {
      // simple-peer browser bundle'ını kullan
      'simple-peer': path.resolve(__dirname, 'node_modules/simple-peer/simplepeer.min.js')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})