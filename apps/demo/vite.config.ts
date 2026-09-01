import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: './.vite',
  server: {
    port: 5173,
    host: true,
  },
});

