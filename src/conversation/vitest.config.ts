import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './test-setup.ts')],
    // Conversation tests render React components + jsdom in every file; running
    // multiple file workers in parallel multiplies per-worker heaps and can
    // exhaust the runner (ERR_WORKER_OUT_OF_MEMORY). singleFork runs all files
    // in one worker sequentially — module-specific, does not affect other
    // modules. Keeps the existing vitest version; no repo-wide parallelism loss.
    poolOptions: {
      forks: { singleFork: true },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '*.config.*',
        'dist/',
      ],
    },
  },
});
