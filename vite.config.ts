import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api/': {
        target: 'http://0.0.0.0:8751',
        changeOrigin: true
      },
      '/auth/': {
        target: 'http://0.0.0.0:8751',
        changeOrigin: true
      },
      '/pb/': {
        target: 'http://0.0.0.0:8080',
        changeOrigin: true,
        rewrite : (path) => path.replace(/^\/pb/, '')
      },
      '/streams/': {
        target: 'http://0.0.0.0:8751',
        changeOrigin: true
      }
    }
  }
});
