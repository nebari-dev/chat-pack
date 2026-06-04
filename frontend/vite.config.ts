import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        semicolons: true,
        routeTreeFileHeader: [
          "// @ts-nocheck",
          "// noinspection JSUnusedGlobalSymbols",
        ],
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
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true
        }
      }
    }
  };
});
