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
    // @mediapipe/tasks-vision is eagerly needed; onnxruntime-web is dynamically
    // imported only when ML detection is active — keep it out of pre-bundle to
    // avoid inflating the initial page load with ~21MB of WASM.
    include: ['@mediapipe/tasks-vision'],
    exclude: ['onnxruntime-web']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'detection-b': ['@mediapipe/tasks-vision'],
          // onnxruntime-web stays in its own async chunk; only fetched when
          // the ML pipeline tab is opened (lazy import in tracking-v-c).
          'detection-c': ['onnxruntime-web']
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    css: false
  }
})
