/**
 * M01 Product Foundation root barrel.
 *
 * Re-exports the foundation sub-barrels so `import('../foundation')` (and
 * `@peaai/foundation`) resolves to a single entry. UI-009's AppProviders
 * performs a best-effort lazy `import('../foundation')` during application
 * bootstrap; without this barrel that import failed to resolve (the build
 * had to shim it — see FE-010). Consumers that need a specific subset should
 * still import the narrower sub-barrels (`../foundation/theme`,
 * `../foundation/components/toast`, ...) for tree-shaking.
 */
export * from './theme';
export * from './components';
export * from './design-system';
