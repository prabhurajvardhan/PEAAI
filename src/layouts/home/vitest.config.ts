import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'test-setup.ts')],
    include: [resolve(__dirname, '__tests__/**/*.test.{ts,tsx}')],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
