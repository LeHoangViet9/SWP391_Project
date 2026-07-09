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
      // MỚI: Proxy các yêu cầu lấy ảnh tĩnh cục bộ (/uploads/**) sang server backend (cổng 8089)
      '/uploads': {
        target: 'http://localhost:8089',
        changeOrigin: true,
      },
    },
  },
});
