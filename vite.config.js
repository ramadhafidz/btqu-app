import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/app.tsx',
      refresh: true,
    }),
    react(),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    cors: true,
    hmr: {
      host: 'localhost',
    },
  },
  optimizeDeps: {
    include: [
      'notistack',
      '@heroicons/react/24/solid',
      '@heroicons/react/24/outline',
    ],
  },
});
