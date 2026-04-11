import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  cacheDir: '../../node_modules/.vite/libs/io',
  root: __dirname,
  test: {
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: './test-output/vitest/coverage',
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    name: '@xstate-workshop/io',
    reporters: ['default'],
    watch: false,
  },
}));
