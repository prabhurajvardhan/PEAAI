/**
 * Placeholder system for lazy loading
 */

export interface PlaceholderConfig {
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  borderRadius?: string;
  animation?: 'pulse' | 'skeleton' | 'none';
  className?: string;
}

export interface PlaceholderStyle {
  width: string;
  height: string;
  backgroundColor: string;
  borderRadius: string;
  animation: string;
  position: string;
  overflow: string;
}

const defaultConfig: Required<PlaceholderConfig> = {
  width: '100%',
  height: '200px',
  backgroundColor: '#e0e0e0',
  borderRadius: '4px',
  animation: 'pulse',
  className: '',
};

export function createPlaceholderStyle(config: PlaceholderConfig = {}): PlaceholderStyle {
  const merged = { ...defaultConfig, ...config };

  return {
    width: typeof merged.width === 'number' ? `${merged.width}px` : String(merged.width),
    height: typeof merged.height === 'number' ? `${merged.height}px` : String(merged.height),
    backgroundColor: merged.backgroundColor,
    borderRadius: merged.borderRadius,
    animation: merged.animation,
    position: 'relative',
    overflow: 'hidden',
  };
}

export function createPlaceholderElement(config: PlaceholderConfig = {}): HTMLElement {
  const element = document.createElement('div');
  const style = createPlaceholderStyle(config);

  Object.assign(element.style, style);

  if (config.className) {
    element.className = config.className;
  }

  if (style.animation === 'pulse') {
    element.style.backgroundImage = 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)';
    element.style.backgroundSize = '200% 100%';
    element.style.animation = 'placeholder-pulse 1.5s ease-in-out infinite';
  } else if (style.animation === 'skeleton') {
    element.style.backgroundImage = `
      linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%),
      linear-gradient(#e0e0e0 100%, #f0f0f0 0%)
    `;
    element.style.backgroundSize = '50px 100%, 100% 100%';
    element.style.animation = 'placeholder-skeleton 1.2s ease-in-out infinite';
  }

  return element;
}

export function addPlaceholderStyles(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'peaai-placeholder-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes placeholder-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    @keyframes placeholder-skeleton {
      0% { background-position: -100px 0, 0 0; }
      100% { background-position: 200px 0, 0 0; }
    }
    
    .peaai-placeholder {
      display: block;
    }
    
    .peaai-placeholder.fade-in {
      transition: opacity 0.3s ease-in-out;
    }
    
    .peaai-placeholder.fade-out {
      opacity: 0;
    }
  `;

  document.head.appendChild(style);
}

export class PlaceholderManager {
  private placeholders: Map<HTMLElement, HTMLElement> = new Map();

  show(element: HTMLElement, config: PlaceholderConfig = {}): void {
    if (this.placeholders.has(element)) return;

    addPlaceholderStyles();

    const placeholder = createPlaceholderElement(config);
    placeholder.classList.add('peaai-placeholder');

    element.style.position = 'relative';
    placeholder.style.position = 'absolute';
    placeholder.style.top = '0';
    placeholder.style.left = '0';
    placeholder.style.width = '100%';
    placeholder.style.height = '100%';
    placeholder.style.zIndex = '1';

    element.appendChild(placeholder);
    this.placeholders.set(element, placeholder);
  }

  hide(element: HTMLElement, fadeOut: boolean = true): void {
    const placeholder = this.placeholders.get(element);
    if (!placeholder) return;

    if (fadeOut) {
      placeholder.classList.add('fade-out');
      placeholder.classList.add('fade-in');
      setTimeout(() => {
        this.removePlaceholder(element);
      }, 300);
    } else {
      this.removePlaceholder(element);
    }
  }

  private removePlaceholder(element: HTMLElement): void {
    const placeholder = this.placeholders.get(element);
    if (placeholder && placeholder.parentNode === element) {
      element.removeChild(placeholder);
    }
    this.placeholders.delete(element);
  }

  clear(): void {
    this.placeholders.forEach((placeholder, element) => {
      if (placeholder.parentNode === element) {
        element.removeChild(placeholder);
      }
    });
    this.placeholders.clear();
  }

  hasPlaceholder(element: HTMLElement): boolean {
    return this.placeholders.has(element);
  }
}

export const placeholderManager = new PlaceholderManager();

export { PlaceholderManager as default };
