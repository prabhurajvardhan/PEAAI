/**
 * Cleanup Hooks - Register and execute cleanup functions
 */

export type CleanupHook = () => void | Promise<void>;

export interface CleanupRegistration {
  id: string;
  hook: CleanupHook;
  name: string;
  priority: number;
  once: boolean;
  executed: boolean;
  timestamp: number;
}

export interface CleanupHookConfig {
  enableLogging?: boolean;
  asyncCleanup?: boolean;
  timeout?: number;
}

const defaultConfig: Required<CleanupHookConfig> = {
  enableLogging: false,
  asyncCleanup: true,
  timeout: 5000,
};

export class CleanupManager {
  private config: Required<CleanupHookConfig>;
  private hooks: Map<string, CleanupRegistration> = new Map();
  private cleanupIdCounter: number = 0;
  private isCleaningUp: boolean = false;
  private cleanedIds: Set<string> = new Set();

  constructor(config: CleanupHookConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  register(name: string, hook: CleanupHook, options?: { priority?: number; once?: boolean }): string {
    const id = `cleanup-${++this.cleanupIdCounter}-${name}`;

    const registration: CleanupRegistration = {
      id,
      hook,
      name,
      priority: options?.priority ?? 0,
      once: options?.once ?? false,
      executed: false,
      timestamp: Date.now(),
    };

    this.hooks.set(id, registration);
    this.log(`Registered cleanup hook: ${name} (${id})`);

    return id;
  }

  unregister(id: string): boolean {
    const hook = this.hooks.get(id);
    if (!hook) return false;

    if (this.isCleaningUp) {
      this.cleanedIds.add(id);
    }

    this.hooks.delete(id);
    this.log(`Unregistered cleanup hook: ${id}`);
    return true;
  }

  once(name: string, hook: CleanupHook, priority?: number): string {
    return this.register(name, hook, { priority, once: true });
  }

  has(id: string): boolean {
    return this.hooks.has(id);
  }

  async cleanup(): Promise<void> {
    if (this.isCleaningUp) {
      console.warn('Cleanup already in progress');
      return;
    }

    this.isCleaningUp = true;
    this.log('Starting cleanup...');

    const sortedHooks = this.getSortedHooks();

    if (this.config.asyncCleanup) {
      await this.cleanupAsync(sortedHooks);
    } else {
      this.cleanupSync(sortedHooks);
    }

    this.isCleaningUp = false;
    this.cleanedIds.clear();
    this.log('Cleanup complete');
  }

  private getSortedHooks(): CleanupRegistration[] {
    return Array.from(this.hooks.values())
      .filter((h) => !h.executed && !this.cleanedIds.has(h.id))
      .sort((a, b) => b.priority - a.priority);
  }

  private cleanupSync(hooks: CleanupRegistration[]): void {
    for (const hook of hooks) {
      try {
        hook.hook();
        hook.executed = true;
        this.log(`Executed cleanup hook: ${hook.name}`);
      } catch (error) {
        console.error(`Cleanup hook "${hook.name}" failed:`, error);
      }
    }

    for (const hook of hooks.filter((h) => h.once)) {
      this.hooks.delete(hook.id);
    }
  }

  private async cleanupAsync(hooks: CleanupRegistration[]): Promise<void> {
    for (const hook of hooks) {
      try {
        if (this.isAsyncHook(hook.hook)) {
          await this.executeWithTimeout(hook.hook, this.config.timeout);
        } else {
          hook.hook();
        }
        hook.executed = true;
        this.log(`Executed cleanup hook: ${hook.name}`);
      } catch (error) {
        console.error(`Cleanup hook "${hook.name}" failed:`, error);
      }
    }

    for (const hook of hooks.filter((h) => h.once)) {
      this.hooks.delete(hook.id);
    }
  }

  private isAsyncHook(hook: CleanupHook): boolean {
    return hook.constructor?.name === 'AsyncFunction' ||
           hook.toString().includes('async');
  }

  private async executeWithTimeout(fn: CleanupHook, timeout: number): Promise<void> {
    return Promise.race([
      fn(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(`Cleanup hook timeout: ${timeout}ms`)), timeout)
      ),
    ]) as Promise<void>;
  }

  getHooks(): CleanupRegistration[] {
    return Array.from(this.hooks.values());
  }

  getHook(id: string): CleanupRegistration | undefined {
    return this.hooks.get(id);
  }

  getPendingCount(): number {
    return Array.from(this.hooks.values()).filter((h) => !h.executed).length;
  }

  isRegistered(name: string): boolean {
    return Array.from(this.hooks.values()).some((h) => h.name === name);
  }

  clear(): void {
    const count = this.hooks.size;
    this.hooks.clear();
    this.log(`Cleared ${count} cleanup hooks`);
  }

  reset(): void {
    for (const hook of this.hooks.values()) {
      hook.executed = false;
    }
    this.cleanedIds.clear();
    this.log('Reset cleanup hooks');
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[CleanupManager] ${message}`);
    }
  }

  getStats(): {
    totalHooks: number;
    pendingHooks: number;
    executedHooks: number;
    isCleaningUp: boolean;
  } {
    const all = Array.from(this.hooks.values());
    return {
      totalHooks: all.length,
      pendingHooks: all.filter((h) => !h.executed).length,
      executedHooks: all.filter((h) => h.executed).length,
      isCleaningUp: this.isCleaningUp,
    };
  }
}

export { CleanupManager as default };

export function createCleanupHook(
  cleanupManager: CleanupManager,
  name: string,
  hook: CleanupHook
): () => void {
  const id = cleanupManager.register(name, hook);
  return () => cleanupManager.unregister(id);
}
