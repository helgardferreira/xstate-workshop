import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  cacheDir: '../../node_modules/.vite/apps/scene-workbench',
  root: __dirname,
  test: {
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: './test-output/vitest/coverage',
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    name: 'scene-workbench',
    reporters: ['default'],
    watch: false,
  },
  // Uncomment this if you are using workers.
  /*
  worker: {
   plugins: [ nxViteTsPaths() ],
  },
  */
}));
