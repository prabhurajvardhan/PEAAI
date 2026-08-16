import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// AppProviders (in src/app/providers/) lazily `import('../../foundation')`
// during boot, which resolves to the M01 root barrel `src/foundation/index.ts`.
// From this test file (src/app/__tests/) that same module is `../../foundation`,
// so we mock that specifier. The success-path boot resolves quickly and
// deterministically; the failure path is driven in the second describe block.
vi.mock('../../foundation', () => ({}));

describe('App bootstrap lifecycle (success path)', () => {
  it('mounts the provider tree and transitions from the loading screen to the main UI', async () => {
    const { App } = await import('../App');
    render(<App />);

    // Initial render shows the bootstrap loading screen.
    expect(screen.getByText('Initializing PEAAI...')).toBeInTheDocument();

    // After the async initialization in AppProviders runs, onReady() fires and
    // isLoading flips to false, revealing the main application UI.
    await waitFor(() => {
      expect(screen.getByText('Welcome to the AI Companion experience.')).toBeInTheDocument();
    });

    // The loading screen must be gone once initialized.
    expect(screen.queryByText('Initializing PEAAI...')).not.toBeInTheDocument();
  });

  it('does not stay on the loading screen indefinitely (no infinite bootstrap)', async () => {
    const { App } = await import('../App');
    render(<App />);

    // Regression guard for the gate-before-bootstrap ordering bug: the app
    // MUST leave the "Initializing PEAAI..." state. A stuck bootstrap would
    // time out here.
    await waitFor(
      () => {
        expect(screen.queryByText('Initializing PEAAI...')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});

describe('App bootstrap lifecycle (failure path)', () => {
  beforeEach(() => {
    // Force the foundation bootstrap import to reject, simulating a genuine
    // initialization failure (e.g. a failed module bootstrap). Using doMock +
    // resetModules keeps this isolated from the success-path mock above.
    vi.resetModules();
    vi.doMock('../../foundation', async () => {
      throw new Error('foundation init failed');
    });
  });

  it('renders a recoverable error UI instead of an infinite spinner when initialization fails', async () => {
    const { App } = await import('../App');
    render(<App />);

    // Initialization fails -> the app must NOT remain on the loading screen.
    // It must surface a recoverable error/fallback UI (never infinite loading).
    await waitFor(
      () => {
        expect(screen.queryByText('Initializing PEAAI...')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // A retry affordance must be present so the failure is recoverable.
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
