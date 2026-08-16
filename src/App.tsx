import React from 'react';
import { ThemeProvider } from './foundation/theme';
import { ToastProvider } from './foundation/components/toast';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { ModuleProvider } from './integration';
import { LandingPage } from './pages/landing';

/**
 * PEAAI root application component.
 *
 * Composes the existing PEAAI module surface — UI-009's provider hierarchy
 * (ErrorBoundary > ThemeProvider > ToastProvider > ModuleProvider) and the
 * existing pages — rather than inventing new UI.
 *
 * NOTE on routing: PEAAI does not yet have a router. UI-009's App shell
 * (src/app/App.tsx) renders a placeholder noting "Routes and pages will be
 * integrated by UI-004", and src/app/types.ts defines a Route interface with
 * no implementation. Landing/Auth/Home page composition and navigation is
 * UI-004's (T-004) unfinished responsibility. This root App renders the
 * Landing page as the initial application view so the production build is a
 * runnable frontend. When UI-004 delivers routing, App should compose the
 * router (Landing -> Auth -> Home) here.
 *
 * This root App intentionally does not use UI-009's AppProviders wrapper:
 * src/app/providers/AppProviders.tsx performs a dynamic `import('../foundation')`
 * which resolves to src/foundation/ — a directory with no index.ts entry. That
 * import is unresolvable at build time and is reported to the CA as a
 * UI-009 defect (category B). The providers it wraps are composed directly here.
 */
export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <ModuleProvider>
            <LandingPage />
          </ModuleProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
