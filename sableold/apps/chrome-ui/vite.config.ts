import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build output is loaded by Electron via file:// — relative paths required.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
