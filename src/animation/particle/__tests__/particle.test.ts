/**
 * Tests for Particle System (T-024)
 */

import { ParticleEmitter, ParticleSystem } from '../particle';

describe('Particle System', () => {
  describe('ParticleEmitter', () => {
    let emitter: ParticleEmitter;

    beforeEach(() => {
      emitter = new ParticleEmitter({
        position: { x: 100, y: 100 },
        emissionRate: 10,
        maxParticles: 50,
        particleLifetime: 1000,
        initialVelocity: { x: 0, y: 50 },
        sizeStart: 4,
        sizeEnd: 0,
        colorStart: { r: 255, g: 0, b: 0, a: 255 },
        colorEnd: { r: 255, g: 0, b: 0, a: 0 },
        emitterShape: 'point',
        autoStart: false,
      });
    });

    afterEach(() => {
      emitter.destroy();
    });

    describe('emit', () => {
      it('should emit particles', () => {
        emitter.emit(5);
        expect(emitter.getActiveCount()).toBe(5);
      });

      it('should respect max particles limit', () => {
        emitter.emit(100);
        expect(emitter.getActiveCount()).toBeLessThanOrEqual(50);
      });
    });

    describe('update', () => {
      it('should update particle positions', () => {
        emitter.emit(1);
        const particles = emitter.getActiveParticles();
        const initialY = particles[0].y;

        emitter.update(16); // ~1 frame at 60fps
        emitter.update(16);

        const updatedY = emitter.getActiveParticles()[0]?.y;
        expect(updatedY).not.toBe(initialY);
      });

      it('should remove dead particles', () => {
        emitter.emit(5);
        expect(emitter.getActiveCount()).toBe(5);

        emitter.update(2000); // Past lifetime
        expect(emitter.getActiveCount()).toBe(0);
      });

      it('should not update when paused', () => {
        emitter.emit(5);
        const particles = emitter.getActiveParticles();
        const initialY = particles[0].y;

        emitter.pause();
        emitter.update(100);

        const updatedY = emitter.getActiveParticles()[0]?.y;
        expect(updatedY).toBe(initialY);
      });
    });

    describe('pause and resume', () => {
      it('should pause emission', () => {
        emitter.start();
        emitter.emit(5);
        emitter.pause();

        emitter.update(100);
        expect(emitter.getActiveCount()).toBe(5);
      });

      it('should resume emission', () => {
        emitter.start();
        emitter.pause();
        emitter.resume();
        emitter.emit(5);

        expect(emitter.getActiveCount()).toBe(5);
      });

      it('should report paused state', () => {
        expect(emitter.isPaused()).toBe(false);
        emitter.pause();
        expect(emitter.isPaused()).toBe(true);
        emitter.resume();
        expect(emitter.isPaused()).toBe(false);
      });
    });

    describe('reset', () => {
      it('should release all particles', () => {
        emitter.emit(10);
        emitter.reset();
        expect(emitter.getActiveCount()).toBe(0);
      });
    });

    describe('position', () => {
      it('should set position', () => {
        emitter.setPosition({ x: 200, y: 300 });
        const pos = emitter.getPosition();
        expect(pos.x).toBe(200);
        expect(pos.y).toBe(300);
      });

      it('should spawn at emitter position', () => {
        emitter.setPosition({ x: 100, y: 100 });
        emitter.emit(1);
        
        const particle = emitter.getActiveParticles()[0];
        expect(particle.x).toBeCloseTo(100, 0);
        expect(particle.y).toBeCloseTo(100, 0);
      });
    });

    describe('burst mode', () => {
      it('should emit all particles at once in burst', () => {
        emitter.burst(10, 0);
        expect(emitter.getActiveCount()).toBe(10);
      });
    });

    describe('emission rate', () => {
      it('should set emission rate', () => {
        emitter.setEmissionRate(100);
        emitter.start();
        emitter.update(100);

        expect(emitter.getActiveCount()).toBeGreaterThan(0);
      });
    });

    describe('onUpdate callback', () => {
      it('should call update callback', () => {
        const callback = jest.fn();
        emitter.onUpdate(callback);

        emitter.emit(5);
        emitter.update(16);

        expect(callback).toHaveBeenCalled();
      });

      it('should return unsubscribe function', () => {
        const callback = jest.fn();
        const unsubscribe = emitter.onUpdate(callback);

        unsubscribe();
        emitter.emit(5);
        emitter.update(16);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('emitter shapes', () => {
      it('should spawn at point', () => {
        const pointEmitter = new ParticleEmitter({
          position: { x: 50, y: 50 },
          emissionRate: 10,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 0 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: false,
        });

        pointEmitter.emit(10);
        const particles = pointEmitter.getActiveParticles();
        
        particles.forEach(p => {
          expect(p.x).toBeCloseTo(50, 0);
          expect(p.y).toBeCloseTo(50, 0);
        });

        pointEmitter.destroy();
      });

      it('should spawn in circle', () => {
        const circleEmitter = new ParticleEmitter({
          position: { x: 50, y: 50 },
          emissionRate: 10,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 0 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'circle',
          emitterRadius: 10,
          autoStart: false,
        });

        circleEmitter.emit(10);
        const particles = circleEmitter.getActiveParticles();
        
        particles.forEach(p => {
          const dist = Math.sqrt((p.x - 50) ** 2 + (p.y - 50) ** 2);
          expect(dist).toBeLessThanOrEqual(10);
        });

        circleEmitter.destroy();
      });

      it('should spawn in rectangle', () => {
        const rectEmitter = new ParticleEmitter({
          position: { x: 50, y: 50 },
          emissionRate: 10,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 0 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'rectangle',
          emitterWidth: 20,
          emitterHeight: 10,
          autoStart: false,
        });

        rectEmitter.emit(10);
        const particles = rectEmitter.getActiveParticles();
        
        particles.forEach(p => {
          expect(p.x).toBeGreaterThanOrEqual(40);
          expect(p.x).toBeLessThanOrEqual(60);
          expect(p.y).toBeGreaterThanOrEqual(45);
          expect(p.y).toBeLessThanOrEqual(55);
        });

        rectEmitter.destroy();
      });
    });
  });

  describe('ParticleSystem', () => {
    let system: ParticleSystem;

    beforeEach(() => {
      system = new ParticleSystem();
    });

    afterEach(() => {
      system.destroy();
    });

    describe('createEmitter', () => {
      it('should create emitter with id', () => {
        const emitter = system.createEmitter('test', {
          position: { x: 0, y: 0 },
          emissionRate: 10,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 0 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: false,
        });

        expect(emitter).toBeDefined();
        expect(system.getEmitter('test')).toBe(emitter);
      });

      it('should throw for duplicate id', () => {
        system.createEmitter('test', {
          position: { x: 0, y: 0 },
          emissionRate: 10,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 0 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: false,
        });

        expect(() => {
          system.createEmitter('test', {
            position: { x: 0, y: 0 },
            emissionRate: 10,
            maxParticles: 50,
            particleLifetime: 1000,
            initialVelocity: { x: 0, y: 0 },
            sizeStart: 4,
            sizeEnd: 0,
            colorStart: { r: 255, g: 0, b: 0, a: 255 },
            colorEnd: { r: 255, g: 0, b: 0, a: 0 },
            emitterShape: 'point',
            autoStart: false,
          });
        }).toThrow();
      });
    });

    describe('removeEmitter', () => {
      it('should remove emitter', () => {
        system.createEmitter('test', {
          position: { x: 0, y: 0 },
          emissionRate: 10,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 0 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: false,
        });

        expect(system.removeEmitter('test')).toBe(true);
        expect(system.getEmitter('test')).toBeUndefined();
      });

      it('should return false for non-existent emitter', () => {
        expect(system.removeEmitter('non-existent')).toBe(false);
      });
    });

    describe('update', () => {
      it('should update all emitters', () => {
        system.createEmitter('e1', {
          position: { x: 0, y: 0 },
          emissionRate: 100,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 100 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: true,
        });

        system.createEmitter('e2', {
          position: { x: 0, y: 0 },
          emissionRate: 100,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 100 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: true,
        });

        system.update(16);
        expect(system.getActiveParticleCount()).toBeGreaterThan(0);
      });
    });

    describe('pause and resume', () => {
      it('should pause all emitters', () => {
        system.createEmitter('test', {
          position: { x: 0, y: 0 },
          emissionRate: 100,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 100 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: true,
        });

        system.pause();
        expect(system.getEmitter('test')?.isPaused()).toBe(true);
      });

      it('should resume all emitters', () => {
        system.createEmitter('test', {
          position: { x: 0, y: 0 },
          emissionRate: 100,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 100 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: true,
        });

        system.pause();
        system.resume();
        expect(system.getEmitter('test')?.isPaused()).toBe(false);
      });
    });

    describe('clear', () => {
      it('should clear all particles', () => {
        const emitter = system.createEmitter('test', {
          position: { x: 0, y: 0 },
          emissionRate: 100,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 100 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: true,
        });

        emitter.emit(10);
        system.clear();
        expect(system.getActiveParticleCount()).toBe(0);
      });
    });

    describe('onUpdate callback', () => {
      it('should call update callback', () => {
        const callback = jest.fn();
        system.onUpdate(callback);

        system.createEmitter('test', {
          position: { x: 0, y: 0 },
          emissionRate: 100,
          maxParticles: 50,
          particleLifetime: 1000,
          initialVelocity: { x: 0, y: 100 },
          sizeStart: 4,
          sizeEnd: 0,
          colorStart: { r: 255, g: 0, b: 0, a: 255 },
          colorEnd: { r: 255, g: 0, b: 0, a: 0 },
          emitterShape: 'point',
          autoStart: true,
        });

        system.update(16);
        expect(callback).toHaveBeenCalled();
      });
    });
  });
});
