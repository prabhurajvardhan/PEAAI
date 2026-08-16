import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Temporary build shim for a category-B cross-module defect (T-FE-010-001):
// UI-009's `src/app/providers/AppProviders.tsx` performs a best-effort
// `import('../foundation')` to lazily initialize the M01 foundation, but
// `src/foundation/` has no root barrel (`index.ts`) — UI-001 only ships the
// sub-barrels `theme/`, `components/`, and `design-system/`. At runtime the
// dynamic import is already designed to fail silently (it is discarded and
// wrapped in `.catch(() => null)`), so resolving it to an empty module is
// behavior-preserving. FE-010 owns the build infrastructure only and must not
// modify `src/foundation/**` (UI-001) or `src/app/providers/AppProviders.tsx`
// (UI-009); this shim lives in the root Vite config and is reported to the CA
// for routing to UI-001 (create `src/foundation/index.ts`) / UI-009.
const foundationEmptyBarrelPlugin: Plugin = {
  name: 'peaai-foundation-empty-barrel-shim',
  enforce: 'pre',
  resolveId(source, importer) {
    // Only intercept the exact unresolved foundation directory import emitted
    // by UI-009's AppProviders. Legitimate sub-barrel imports
    // (`../foundation/theme`, `../foundation/components/toast`, ...) resolve
    // normally and are untouched.
    if (source === '../foundation' && importer && importer.includes('src/app/providers/AppProviders.tsx')) {
      return '\0peaai:foundation-empty';
    }
    return null;
  },
  load(id) {
    if (id === '\0peaai:foundation-empty') {
      return 'export {};\n';
    }
    return null;
  },
};

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
export default defineConfig({
  plugins: [foundationEmptyBarrelPlugin, react()],
  root: path.resolve(__dirname, 'src/app'),
  // Expose the repo root as an alias so module-local code that uses `@/...`
  // (the convention declared in module-local tsconfigs) resolves consistently.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/app'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
});

