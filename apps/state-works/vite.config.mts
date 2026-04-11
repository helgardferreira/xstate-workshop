/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig(() => ({
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    emptyOutDir: true,
    outDir: './dist',
    reportCompressedSize: true,
    target: 'ES2023',
  },
  cacheDir: '../../node_modules/.vite/apps/state-works',
  plugins: [wasm(), tailwindcss()],
  preview: {
    host: 'localhost',
    port: 4200,
    proxy: {
      '/api': { target: 'http://localhost:3000' },
      '/scene': { target: 'ws://localhost:3000', ws: true },
    },
  },
  root: __dirname,
  server: {
    host: 'localhost',
    port: 4200,
    proxy: {
      '/api': { target: 'http://localhost:3000' },
      '/scene': { target: 'ws://localhost:3000', ws: true },
    },
  },
  test: {
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: './test-output/vitest/coverage',
    },
    environment: 'jsdom',
    globals: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    name: 'state-works',
    reporters: ['default'],
    watch: false,
  },
}));
