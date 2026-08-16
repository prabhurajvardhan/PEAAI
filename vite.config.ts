import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// PEAAI root production build configuration.
//
// Vite is the intended production build system: every module-local config
// (src/foundation, src/app, src/integration, src/conversation,
// src/components/landing) uses @vitejs/plugin-react + vitest, and
// src/foundation/package.json declares a `vite build` step. This root config
// establishes the single production application build that Vercel executes.
//
// The root is the repository root so Vercel builds from `npm run build` at the
// top level. `outDir` is `dist/` (the Vercel output directory). Path alias
// `@/*` is not required by the existing module imports (they use relative
// paths), so none is introduced here to avoid changing module resolution.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
