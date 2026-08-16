import { defineConfig } from 'vitest/config';

// Root vitest configuration for the module-less vitest-authored suites
// (`src/companion`, `src/transition`) that have no module-local package.json
// and therefore run under the root vitest (see docs/engineering/CI.md).
//
// This is deliberately separate from `vite.config.ts` (the production build
// config), whose `root` is `src/app`. Without this file, vitest would inherit
// the production `root: src/app` and fail to discover the companion/transition
// suites. AD-010 module-local configs are untouched.
export default defineConfig({
  test: {
    include: ['src/companion/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'src/transition/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
