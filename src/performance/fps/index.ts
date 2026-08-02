/**
 * Performance Engine - FPS Monitor Module
 * 
 * Provides FPS monitoring, display, and alerting capabilities
 * to maintain 60 FPS target performance.
 */

export {
  default as FPSMonitor,
  type FPSConfig,
  type FrameTiming,
} from './fps-monitor';

export {
  default as FPSDisplay,
  type FPSDisplayConfig,
} from './fps-display';

export {
  default as FPSAlertSystem,
  type FPSAlertConfig,
  type FPSAlert,
  type AlertLevel,
} from './fps-alerts';

import FPSMonitor from './fps-monitor';

export const fpsMonitor = new FPSMonitor();

export const FPS_VERSION = '1.0.0';
export const DEFAULT_TARGET_FPS = 60;
