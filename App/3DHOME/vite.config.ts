import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'glb_public',
  server: {
    port: 5179,
    strictPort: false,
    watch: {
      ignored: ['**/reports/**', '**/scripts/**', '**/glb_public/**', '**/public/**'],
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
});
