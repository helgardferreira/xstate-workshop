/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

// TODO: determine if proxy for scene-workbench nestjs backend should be configured here
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
    name: 'state-works',
    reporters: ['default'],
    watch: false,
  },
}));
