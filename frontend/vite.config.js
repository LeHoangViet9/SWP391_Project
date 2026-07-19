import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8089',
        changeOrigin: true,
      },
      // Proxy các yêu cầu lấy ảnh tĩnh cục bộ (/uploads/**) sang server backend (cổng 8089)
      '/uploads': {
        target: 'http://localhost:8089',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách vendor (react, react-dom, router) ra file riêng
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Tách lucide icons ra file riêng vì khá lớn
          icons: ['lucide-react'],
        },
      },
    },
  },
});

