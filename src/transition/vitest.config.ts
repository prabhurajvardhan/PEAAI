import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.d.ts', 'vitest.config.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 55,
        statements: 80,
      },
    },
  },
});
