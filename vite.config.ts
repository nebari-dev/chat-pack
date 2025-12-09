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
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/agents': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/sessions': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/agno_memory': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agno_memory/, '/memories'),
      },
    }
  }
});
