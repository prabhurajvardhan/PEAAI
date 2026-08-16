import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../notifications/useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addNotification', () => {
    it('adds a notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ message: 'Test message' });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].message).toBe('Test message');
    });

    it('adds notification with all options', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Success Title',
          message: 'Operation completed',
          duration: 3000,
          dismissible: true,
        });
      });

      const notification = result.current.notifications[0];
      expect(notification.type).toBe('success');
      expect(notification.title).toBe('Success Title');
      expect(notification.message).toBe('Operation completed');
      expect(notification.duration).toBe(3000);
      expect(notification.dismissible).toBe(true);
    });

    it('generates unique ids for notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ message: 'First' });
        result.current.addNotification({ message: 'Second' });
      });

      expect(result.current.notifications[0].id).not.toBe(result.current.notifications[1].id);
    });

    it('respects custom id', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ id: 'custom-id', message: 'Test' });
      });

      expect(result.current.notifications[0].id).toBe('custom-id');
    });

    it('respects maxNotifications limit', () => {
      const { result } = renderHook(() => useNotifications({ maxNotifications: 3 }));

      act(() => {
        result.current.addNotification({ message: '1' });
        result.current.addNotification({ message: '2' });
        result.current.addNotification({ message: '3' });
        result.current.addNotification({ message: '4' });
        result.current.addNotification({ message: '5' });
      });

      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.notifications[0].message).toBe('3');
      expect(result.current.notifications[1].message).toBe('4');
      expect(result.current.notifications[2].message).toBe('5');
    });
  });

  describe('removeNotification', () => {
    it('removes a notification by id', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ id: 'to-remove', message: 'To remove' });
        result.current.addNotification({ id: 'to-keep', message: 'To keep' });
      });

      act(() => {
        result.current.removeNotification('to-remove');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].id).toBe('to-keep');
    });
  });

  describe('clearAll', () => {
    it('clears all notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ message: 'First' });
        result.current.addNotification({ message: 'Second' });
        result.current.addNotification({ message: 'Third' });
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });

  describe('Helper methods', () => {
    it('info method adds info notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.info('Info message', 'Info Title');
      });

      expect(result.current.notifications[0].type).toBe('info');
      expect(result.current.notifications[0].message).toBe('Info message');
      expect(result.current.notifications[0].title).toBe('Info Title');
    });

    it('success method adds success notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.success('Success!');
      });

      expect(result.current.notifications[0].type).toBe('success');
    });

    it('warning method adds warning notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.warning('Be careful!');
      });

      expect(result.current.notifications[0].type).toBe('warning');
    });

    it('error method adds error notification with duration 0', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.error('Something went wrong');
      });

      expect(result.current.notifications[0].type).toBe('error');
      expect(result.current.notifications[0].duration).toBe(0);
    });

    it('notify method adds info notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notify('Generic notification');
      });

      expect(result.current.notifications[0].type).toBe('info');
    });
  });

  describe('Default values', () => {
    it('uses default duration when not specified', () => {
      const { result } = renderHook(() => useNotifications({ defaultDuration: 5000 }));

      act(() => {
        result.current.addNotification({ message: 'Test' });
      });

      expect(result.current.notifications[0].duration).toBe(5000);
    });

    it('defaults to info type', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ message: 'Test' });
      });

      expect(result.current.notifications[0].type).toBe('info');
    });

    it('defaults to dismissible true', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ message: 'Test' });
      });

      expect(result.current.notifications[0].dismissible).toBe(true);
    });
  });
});
