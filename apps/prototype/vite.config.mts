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
  cacheDir: '../../node_modules/.vite/apps/prototype',
  plugins: [wasm(), tailwindcss()],
  preview: {
    port: 4200,
    host: 'localhost',
  },
  root: __dirname,
  server: {
    port: 4200,
    host: 'localhost',
  },
  test: {
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: './test-output/vitest/coverage',
    },
    environment: 'jsdom',
    globals: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    name: 'prototype',
    reporters: ['default'],
    watch: false,
  },
}));
