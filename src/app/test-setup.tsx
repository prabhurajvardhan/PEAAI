import '@testing-library/jest-dom';

// Mock CSS imports
vi.mock('*.css', () => ({}));

// Mock foundation components
vi.mock('../foundation/theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} }),
}));

vi.mock('../foundation/components/toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({ toasts: [], addToast: () => {}, removeToast: () => {} }),
}));

vi.mock('../foundation/components/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('../foundation/components/spinner', () => ({
  Spinner: () => null,
}));

// jsdom polyfills required by the application shell (HomeLayout/CanvasArea and
// the responsive breakpoint hooks). Mirrors the layouts/home test setup so the
// integrated shell renders under jsdom without ErrorBoundary catching
// environment-missing APIs.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error - jsdom lacks ResizeObserver; provide a minimal mock.
window.ResizeObserver = ResizeObserverMock;

Element.prototype.scrollIntoView = vi.fn();

const originalGetContext = HTMLCanvasElement.prototype.getContext;
// @ts-expect-error - broadening the 2d context signature for jsdom.
HTMLCanvasElement.prototype.getContext = function (contextType: string) {
  if (contextType === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: [] })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: [] })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      imageSmoothingEnabled: false,
      fillStyle: '',
    };
  }
  return originalGetContext?.call(this, contextType);
};
