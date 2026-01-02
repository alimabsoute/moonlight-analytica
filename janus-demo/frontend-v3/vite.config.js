import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    open: true
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@tracking-common': path.resolve(__dirname, '../shared/tracking-common'),
      '@tracking-v-b': path.resolve(__dirname, '../shared/tracking-v-b'),
      '@tracking-v-c': path.resolve(__dirname, '../shared/tracking-v-c')
    }
  },
  optimizeDeps: {
    include: ['onnxruntime-web', '@mediapipe/tasks-vision']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'detection-b': ['@mediapipe/tasks-vision'],
          'detection-c': ['onnxruntime-web']
        }
      }
    }
  }
})
