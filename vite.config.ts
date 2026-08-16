import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PEAAI root production build configuration.
//
// The application shell is UI-009's `src/app/` (index.html + main.tsx + App.tsx),
// reused in place. Vite's `root` is pointed at `src/app` so the existing
// `src/app/index.html` (which references `./main.tsx`) is the build entry. The
// production output is emitted to the repository-root `dist/` for Vercel.
//
// Runtime dependencies (react/react-dom) are declared in the root package.json so
// every module reachable from the entry — including those outside `src/app/`
// (foundation, pages, layouts, ...) — resolves react during bundling. This does
// not touch module-local test configuration (AD-010 isolation is preserved).
//
// Note: UI-009's AppProviders performs a best-effort lazy `import('../foundation')`
// during bootstrap. That now resolves natively to `src/foundation/index.ts`
// (the M01 root barrel), so no build shim is required.
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/app'),
  // Expose the repo root as an alias so module-local code that uses `@/...`
  // (the convention declared in module-local tsconfigs) resolves consistently.
  resolve: {
    alias: [
      {
        // AppProviders (src/app/providers/) lazily `import('../../foundation')`
        // during bootstrap. `src/foundation` is a workspace package whose
        // package.json `main` points at a pre-built `dist/index.js` that does
        // not exist in this monorepo (modules are consumed as source). Resolve
        // the bare directory import to the source root barrel explicitly so
        // Vite/rolldown bundles the TS source instead of failing on the
        // missing `dist`. Narrow sub-barrel imports (`../foundation/theme`,
        // `../foundation/components/toast`, ...) already resolve to source and
        // are untouched.
        find: /^..\/..\/foundation$/,
        replacement: path.resolve(__dirname, 'src/foundation/index.ts'),
      },
      {
        find: /^@\/$/,
        replacement: path.resolve(__dirname, 'src/app'),
      },
      {
        // `@/...` alias (convention declared in module-local tsconfigs).
        find: /^@(.+)$/,
        replacement: path.resolve(__dirname, 'src/app$1'),
      },
    ],
    // The monorepo ships multiple physical copies of react/react-dom (root +
    // module-local node_modules). Bundle a single instance to avoid the
    // "Cannot read properties of null (reading 'useState')" hooks error caused
    // by two React instances crossing a provider boundary.
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
});

