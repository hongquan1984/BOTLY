import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'glb_public',
  server: {
    port: 5179,
    host: true,
    strictPort: false,
    watch: {
      ignored: ['**/reports/**', '**/scripts/**', '**/glb_public/**', '**/public/**'],
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        village: resolve(__dirname, 'village.html'),
      },
    },
  },
});
