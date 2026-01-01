import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      semicolons: true
    }),
    tailwindcss(),
    react() // Dummy comment to force Vite re-optimization
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/agents': {
        target: 'http://backend:8000',
        changeOrigin: true
      },
      '/config': {
        target: 'http://backend:8000',
        changeOrigin: true
      },
      '/sessions': {
        target: 'http://backend:8000',
        changeOrigin: true
      }
    }
  }
});
