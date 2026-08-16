import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // AppProviders (in src/app/providers/) lazily `import('../../foundation')`
      // during bootstrap, which resolves to the M01 root barrel
      // `src/foundation/index.ts`. Resolve it explicitly so the dynamic import
      // is resolvable in the test environment (mirrors the production Vite
      // config). Use an exact-match regex so narrow sub-barrel imports
      // (`../foundation/theme`, `../foundation/components/toast`, ...) are NOT
      // hijacked — those stay mocked via test-setup.tsx.
      {
        find: /^..\/..\/foundation$/,
        replacement: path.resolve(__dirname, '../foundation/index.ts'),
      },
    ],
    // The app module ships its own node_modules/react, while the pages/layout
    // modules it now composes (src/pages/*, src/layouts/*) resolve react from
    // the repository root. Without dedupe the shell crosses two React
    // instances and throws "Invalid hook call" / "Cannot read properties of
    // null (reading 'useState')". Bundle a single React instance (mirrors the
    // production vite.config.ts).
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.tsx'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
  },
});
