import { useAppContext } from './providers';
import { LandingPage } from '../pages/landing';
import { AuthPage } from '../pages/auth';
import { HomePage } from '../pages/home';

// PEAAI application shell.
//
// Composes the EXISTING production pages (UI-002 landing, auth forms, UI-004
// home layout) into a single application. Routing reuses the navigation model
// already built into the app layer: AppProviders exposes `currentRoute` +
// `setCurrentRoute`, and the home Sidebar calls `onNavigate(route)`. No router
// dependency is introduced — this is the architecture the repository already
// specifies.
//
// The shell renders regardless of backend availability: LandingPage and the
// HomeLayout/companion canvas operate on local state, and AuthPage's useAuth
// degrades gracefully (failed auth calls surface as form errors rather than
// crashing the app).

const HOME_ROUTES = new Set(['/', '/home', '/chat', '/stories', '/settings']);

export function AppShell() {
  const { currentRoute } = useAppContext();

  // Landing page → entry surface. CTA navigates to auth, then the app.
  if (currentRoute === '/landing') {
    return <LandingPage />;
  }

  // Auth page → login/register/reset. Falls back to home on a successful
  // session (handled below); on failure the form shows its own error UI.
  if (currentRoute === '/auth') {
    return <AuthPage />;
  }

  // Home (and every app-internal route surfaced by the Sidebar: /, /home,
  // /chat, /stories, /settings) renders the full companion application layout
  // (sidebar + companion canvas + chat). HomePage owns that composition.
  if (HOME_ROUTES.has(currentRoute)) {
    return <HomePage />;
  }

  // Default: boot into the application home rather than a blank screen.
  return <HomePage />;
}

export default AppShell;
