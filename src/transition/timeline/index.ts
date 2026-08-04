/**
 * Transition Timeline Module
 * 
 * Coordinates transition timing and synchronization.
 */

export { TransitionTimelineController, createTimelineController } from './timeline-controller';
export type {
  TimelineConfig,
  TimelineState,
  TimelineCallback,
  TimelineEvent,
  TimelineEventType,
  TimelineSegment,
  TimelineKeyframe,
  TransitionRequest,
  AnimationSyncData,
  ScheduledHook,
} from './types';
export { DEFAULT_TIMELINE_CONFIG } from './types';
