import { describe, it, expect, vi } from 'vitest';
import { eventBus } from '../ModuleIntegration.tsx';

describe('EventBus', () => {
  it('allows subscribing to events', () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.on('test-event', handler);
    
    eventBus.emit('test-event', { message: 'hello' });
    
    expect(handler).toHaveBeenCalledWith({ message: 'hello' });
    
    unsubscribe();
  });

  it('allows unsubscribing from events', () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.on('test-event', handler);
    
    unsubscribe();
    eventBus.emit('test-event', { message: 'hello' });
    
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles once subscriptions', () => {
    const handler = vi.fn();
    eventBus.once('once-event', handler);
    
    eventBus.emit('once-event', { count: 1 });
    eventBus.emit('once-event', { count: 2 });
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ count: 1 });
  });

  it('allows off with specific handler', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    eventBus.on('multi-handler', handler1);
    eventBus.on('multi-handler', handler2);
    
    eventBus.off('multi-handler', handler1);
    eventBus.emit('multi-handler');
    
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
    
    // Cleanup
    eventBus.off('multi-handler');
  });

  it('clears all handlers with offAll', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    eventBus.on('clear-event-1', handler1);
    eventBus.on('clear-event-2', handler2);
    
    eventBus.offAll();
    eventBus.emit('clear-event-1');
    eventBus.emit('clear-event-2');
    
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('handles errors in handlers gracefully', () => {
    const errorHandler = vi.fn(() => {
      throw new Error('Handler error');
    });
    const successHandler = vi.fn();
    
    eventBus.on('error-handler-event', errorHandler);
    eventBus.on('error-handler-event', successHandler);
    
    // Should not throw
    eventBus.emit('error-handler-event');
    
    expect(errorHandler).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
    
    // Cleanup
    eventBus.offAll();
  });
});
