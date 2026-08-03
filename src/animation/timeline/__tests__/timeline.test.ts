/**
 * Tests for Timeline Engine (T-020)
 */

import { TimelineEngine } from '../timeline';

describe('Timeline Engine', () => {
  describe('TimelineEngine', () => {
    let timeline: TimelineEngine;

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      timeline?.destroy();
      jest.useRealTimers();
    });

    describe('constructor', () => {
      it('should create timeline with correct duration', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        expect(timeline.getDuration()).toBe(1000);
      });

      it('should create paused timeline by default', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        expect(timeline.isPlaying()).toBe(false);
        expect(timeline.isPaused()).toBe(false);
      });

      it('should create playing timeline when autoPlay is true', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        expect(timeline.isPlaying()).toBe(true);
      });

      it('should set initial time scale', () => {
        timeline = new TimelineEngine({ duration: 1000, timeScale: 2 });
        expect(timeline.getTimeScale()).toBe(2);
      });
    });

    describe('play', () => {
      it('should start playing', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.play();
        expect(timeline.isPlaying()).toBe(true);
      });

      it('should trigger start callback', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        const startCallback = jest.fn();
        timeline.onStart(startCallback);
        timeline.play();
        expect(startCallback).toHaveBeenCalled();
      });

      it('should not restart if already playing', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        const startCallback = jest.fn();
        timeline.onStart(startCallback);
        timeline.play();
        expect(startCallback).toHaveBeenCalledTimes(0);
      });
    });

    describe('pause', () => {
      it('should pause playing timeline', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        timeline.pause();
        expect(timeline.isPlaying()).toBe(false);
        expect(timeline.isPaused()).toBe(true);
      });

      it('should not affect stopped timeline', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.pause();
        expect(timeline.isPaused()).toBe(false);
      });
    });

    describe('stop', () => {
      it('should stop playing timeline', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        timeline.stop();
        expect(timeline.isPlaying()).toBe(false);
        expect(timeline.isPaused()).toBe(false);
      });

      it('should reset running state', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        timeline.stop();
        expect(timeline.isPlaying()).toBe(false);
      });
    });

    describe('seek', () => {
      it('should seek to specified time', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.seek(500);
        expect(timeline.getCurrentTime()).toBe(500);
        expect(timeline.getProgress()).toBe(0.5);
      });

      it('should clamp seek to valid range', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.seek(1500);
        expect(timeline.getCurrentTime()).toBe(1000);
        
        timeline.seek(-100);
        expect(timeline.getCurrentTime()).toBe(0);
      });

      it('should seek while playing', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        timeline.seek(500);
        expect(timeline.isPlaying()).toBe(true);
        expect(timeline.getCurrentTime()).toBe(500);
      });
    });

    describe('getProgress', () => {
      it('should return 0 at start', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        expect(timeline.getProgress()).toBe(0);
      });

      it('should return 1 at end', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.seek(1000);
        expect(timeline.getProgress()).toBe(1);
      });

      it('should return correct progress', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.seek(250);
        expect(timeline.getProgress()).toBe(0.25);
      });
    });

    describe('timeScale', () => {
      it('should update time scale', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.setTimeScale(0.5);
        expect(timeline.getTimeScale()).toBe(0.5);
      });

      it('should throw for negative time scale', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        expect(() => timeline.setTimeScale(-1)).toThrow();
      });

      it('should handle zero time scale (paused effect)', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        timeline.setTimeScale(0);
        expect(timeline.isPlaying()).toBe(true);
      });
    });

    describe('onFrame callback', () => {
      it('should call frame callback when updated', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        const frameCallback = jest.fn();
        timeline.onFrame(frameCallback);
        
        timeline.play();
        timeline.update(performance.now() + 50);
        
        expect(frameCallback).toHaveBeenCalled();
        timeline.destroy();
      });

      it('should receive progress and delta time', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        let receivedArgs: [number, number][] = [];
        timeline.onFrame((progress, dt) => {
          receivedArgs.push([progress, dt]);
        });
        
        timeline.play();
        timeline.update(performance.now() + 50);
        
        expect(receivedArgs.length).toBeGreaterThan(0);
        timeline.destroy();
      });

      it('should return unsubscribe function', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        const frameCallback = jest.fn();
        const unsubscribe = timeline.onFrame(frameCallback);
        
        unsubscribe();
        timeline.play();
        expect(frameCallback).not.toHaveBeenCalled();
      });
    });

    describe('onComplete callback', () => {
      it('should call complete callback when animation ends', () => {
        timeline = new TimelineEngine({ duration: 100 });
        const completeCallback = jest.fn();
        timeline.onComplete(completeCallback);
        
        timeline.play();
        timeline.update(performance.now() + 200);
        
        expect(completeCallback).toHaveBeenCalled();
        timeline.destroy();
      });

      it('should call complete only once for non-looping animation', () => {
        timeline = new TimelineEngine({ duration: 100 });
        const completeCallback = jest.fn();
        timeline.onComplete(completeCallback);
        
        timeline.play();
        timeline.update(performance.now() + 250);
        
        expect(completeCallback).toHaveBeenCalledTimes(1);
        timeline.destroy();
      });

      it('should not call complete for infinite looping animation', () => {
        // Infinite loop (loopCount = 0) should never complete
        timeline = new TimelineEngine({ duration: 100, loop: true, loopCount: 0 });
        const completeCallback = jest.fn();
        timeline.onComplete(completeCallback);
        
        timeline.play();
        timeline.update(performance.now() + 2000);
        
        expect(completeCallback).not.toHaveBeenCalled();
        timeline.destroy();
      });
    });

    describe('looping', () => {
      it('should loop animation when loop is true', () => {
        timeline = new TimelineEngine({ duration: 100, loop: true });
        const frameCallback = jest.fn();
        timeline.onFrame(frameCallback);
        
        timeline.play();
        timeline.update(performance.now() + 50);
        
        expect(frameCallback).toHaveBeenCalled();
        timeline.destroy();
      });

      it('should respect loop count', () => {
        timeline = new TimelineEngine({ duration: 100, loop: true, loopCount: 2 });
        const completeCallback = jest.fn();
        timeline.onComplete(completeCallback);
        
        timeline.play();
        timeline.update(performance.now() + 350);
        
        expect(completeCallback).toHaveBeenCalledTimes(1);
        timeline.destroy();
      });
    });

    describe('destroy', () => {
      it('should clear all callbacks', () => {
        timeline = new TimelineEngine({ duration: 1000 });
        timeline.onFrame(() => {});
        timeline.onComplete(() => {});
        timeline.onStart(() => {});
        
        timeline.destroy();
        
        timeline.play();
        jest.advanceTimersByTime(16);
        // Should not throw
      });

      it('should stop animation', () => {
        timeline = new TimelineEngine({ duration: 1000, autoPlay: true });
        timeline.destroy();
        expect(timeline.isPlaying()).toBe(false);
      });
    });
  });
});
