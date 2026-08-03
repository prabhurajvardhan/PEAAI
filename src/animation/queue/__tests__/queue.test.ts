/**
 * Tests for Animation Queue (T-023)
 */

import { AnimationQueue } from '../queue';
import { AnimationPriority } from '../../types';

describe('Animation Queue', () => {
  let queue: AnimationQueue;

  beforeEach(() => {
    queue = new AnimationQueue({ maxConcurrent: 2, maxQueueSize: 10 });
  });

  describe('enqueue', () => {
    it('should add animation to queue', () => {
      const id = queue.enqueue({
        name: 'test',
        priority: 'normal',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      expect(id).toBeDefined();
      expect(queue.size).toBe(1);
    });

    it('should use default priority', () => {
      queue = new AnimationQueue({ defaultPriority: 'high' });
      queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      const anim = queue.getAll()[0];
      expect(anim.priority).toBe('high');
    });

    it('should throw when queue is full', () => {
      queue = new AnimationQueue({ maxQueueSize: 1 });
      queue.enqueue({
        name: 'test1',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      expect(() => {
        queue.enqueue({
          name: 'test2',
          duration: 1000,
          delay: 0,
          properties: { x: { from: 0, to: 100 } },
          easing: (t) => t,
        });
      }).toThrow('Queue is full');
    });

    it('should throw for duplicate names', () => {
      queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      expect(() => {
        queue.enqueue({
          name: 'test',
          duration: 1000,
          delay: 0,
          properties: { x: { from: 0, to: 100 } },
          easing: (t) => t,
        });
      }).toThrow('already in queue');
    });
  });

  describe('dequeue', () => {
    it('should return null when queue is empty', () => {
      expect(queue.dequeue()).toBeNull();
    });

    it('should return next animation', () => {
      queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      const animation = queue.dequeue();
      expect(animation).not.toBeNull();
      expect(animation?.state).toBe('running');
    });

    it('should respect max concurrent limit', () => {
      for (let i = 0; i < 3; i++) {
        queue.enqueue({
          name: `test${i}`,
          duration: 1000,
          delay: 0,
          properties: { x: { from: 0, to: 100 } },
          easing: (t) => t,
        });
      }

      queue.dequeue();
      queue.dequeue();
      const third = queue.dequeue();

      expect(third).toBeNull();
      expect(queue.getRunning().length).toBe(2);
    });
  });

  describe('cancel', () => {
    it('should cancel queued animation', () => {
      const id = queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      expect(queue.cancel(id)).toBe(true);
      expect(queue.size).toBe(0);
    });

    it('should return false for non-existent animation', () => {
      expect(queue.cancel('non-existent')).toBe(false);
    });

    it('should call onCancel callback', () => {
      const onCancel = jest.fn();
      const id = queue.enqueue({
        name: 'test',
        duration: 1000,
        properties: { x: { from: 0, to: 100 } },
      });

      queue.dequeue(); // Start the animation first
      queue.cancel(id);
      expect(queue.size).toBe(0);
    });
  });

  describe('cancelAll', () => {
    it('should cancel all animations', () => {
      for (let i = 0; i < 3; i++) {
        queue.enqueue({
          name: `test${i}`,
          duration: 1000,
          delay: 0,
          properties: { x: { from: 0, to: 100 } },
          easing: (t) => t,
        });
      }

      const count = queue.cancelAll();
      expect(count).toBe(3);
      expect(queue.size).toBe(0);
    });

    it('should cancel with filter', () => {
      queue.enqueue({
        name: 'test1',
        priority: 'high',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.enqueue({
        name: 'test2',
        priority: 'low',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      const count = queue.cancelAll(a => a.priority === 'high');
      expect(count).toBe(1);
      expect(queue.size).toBe(1);
    });
  });

  describe('pause and resume', () => {
    it('should pause running animation', () => {
      const id = queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.dequeue();

      expect(queue.pause(id)).toBe(true);
      const anim = queue.get(id);
      expect(anim?.state).toBe('paused');
    });

    it('should resume paused animation', () => {
      const id = queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.dequeue();
      queue.pause(id);

      expect(queue.resume(id)).toBe(true);
      const anim = queue.get(id);
      expect(anim?.state).toBe('running');
    });

    it('should pause all animations', () => {
      queue.enqueue({
        name: 'test1',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.enqueue({
        name: 'test2',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.dequeue();
      queue.dequeue();

      queue.pauseAll();
      expect(queue.getRunning().every(a => a.state === 'paused')).toBe(true);
    });

    it('should resume all animations', () => {
      queue.enqueue({
        name: 'test1',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.dequeue();
      queue.pauseAll();

      queue.resumeAll();
      expect(queue.getRunning().every(a => a.state === 'running')).toBe(true);
    });
  });

  describe('get methods', () => {
    beforeEach(() => {
      queue.enqueue({
        name: 'test1',
        priority: 'high',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.enqueue({
        name: 'test2',
        priority: 'low',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
    });

    it('should get animation by id', () => {
      const all = queue.getAll();
      const anim = queue.get(all[0].id);
      expect(anim).not.toBeNull();
    });

    it('should get all animations', () => {
      const all = queue.getAll();
      expect(all.length).toBe(2);
    });

    it('should filter by priority', () => {
      const high = queue.getByPriority('high');
      expect(high.length).toBe(1);
      expect(high[0].priority).toBe('high');
    });

    it('should filter by state', () => {
      const all = queue.getAll();
      queue.dequeue();
      
      const pending = queue.getByState('pending');
      const running = queue.getByState('running');
      
      expect(pending.length).toBe(1);
      expect(running.length).toBe(1);
    });
  });

  describe('priority ordering', () => {
    it('should order by priority (critical first)', () => {
      queue.enqueue({
        name: 'low',
        priority: 'low',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.enqueue({
        name: 'critical',
        priority: 'critical',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.enqueue({
        name: 'high',
        priority: 'high',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      const queued = queue.getQueued();
      expect(queued[0].name).toBe('critical');
      expect(queued[1].name).toBe('high');
      expect(queued[2].name).toBe('low');
    });
  });

  describe('clear', () => {
    it('should clear all animations', () => {
      for (let i = 0; i < 3; i++) {
        queue.enqueue({
          name: `test${i}`,
          duration: 1000,
          delay: 0,
          properties: { x: { from: 0, to: 100 } },
          easing: (t) => t,
        });
      }

      queue.clear();
      expect(queue.size).toBe(0);
    });
  });

  describe('onChange callback', () => {
    it('should notify on enqueue', () => {
      const callback = jest.fn();
      queue.onChange(callback);

      queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      expect(callback).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = queue.onChange(callback);

      unsubscribe();
      queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update animation progress', () => {
      const onUpdate = jest.fn();
      const id = queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
        onUpdate,
      });

      queue.dequeue();
      queue.update(performance.now() + 500);

      expect(onUpdate).toHaveBeenCalled();
      const [, values] = onUpdate.mock.calls[0];
      expect(values.x).toBeCloseTo(50, 0);
    });

    it('should complete animation at end', () => {
      const onComplete = jest.fn();
      queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
        onComplete,
      });

      queue.dequeue();
      queue.update(performance.now() + 1500);

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('processQueue', () => {
    it('should start queued animations', () => {
      queue = new AnimationQueue({ maxConcurrent: 1 });
      
      queue.enqueue({
        name: 'test1',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.enqueue({
        name: 'test2',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });

      const started = queue.processQueue();
      expect(started).toBe(1);
      expect(queue.getRunning().length).toBe(1);
    });
  });

  describe('isActive', () => {
    it('should return false when empty', () => {
      expect(queue.isActive()).toBe(false);
    });

    it('should return true when animations running', () => {
      queue.enqueue({
        name: 'test',
        duration: 1000,
        delay: 0,
        properties: { x: { from: 0, to: 100 } },
        easing: (t) => t,
      });
      queue.dequeue();

      expect(queue.isActive()).toBe(true);
    });
  });
});
