import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from '../notifications/ToastContainer';
import { Notification } from '../notifications/types';

describe('ToastContainer', () => {
  const mockDismiss = vi.fn();
  const baseNotification: Notification = {
    id: 'test-1',
    type: 'info',
    message: 'Test notification',
    duration: 5000,
    dismissible: true,
    createdAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe('Rendering', () => {
    it('renders notifications', () => {
      render(
        <ToastContainer
          notifications={[baseNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    it('renders with title', () => {
      const notificationWithTitle: Notification = {
        ...baseNotification,
        title: 'Test Title',
      };

      render(
        <ToastContainer
          notifications={[notificationWithTitle]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders with action button', () => {
      const notificationWithAction: Notification = {
        ...baseNotification,
        action: {
          label: 'Click Me',
          onClick: vi.fn(),
        },
      };

      render(
        <ToastContainer
          notifications={[notificationWithAction]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('does not render when notifications array is empty', () => {
      const { container } = render(
        <ToastContainer
          notifications={[]}
          onDismiss={mockDismiss}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Notification Types', () => {
    it('renders info type notification', () => {
      const infoNotification: Notification = {
        ...baseNotification,
        type: 'info',
      };

      render(
        <ToastContainer
          notifications={[infoNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });

    it('renders success type notification', () => {
      const successNotification: Notification = {
        ...baseNotification,
        type: 'success',
        message: 'Operation successful',
      };

      render(
        <ToastContainer
          notifications={[successNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });

    it('renders warning type notification', () => {
      const warningNotification: Notification = {
        ...baseNotification,
        type: 'warning',
        message: 'Warning message',
      };

      render(
        <ToastContainer
          notifications={[warningNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('renders error type notification', () => {
      const errorNotification: Notification = {
        ...baseNotification,
        type: 'error',
        message: 'Error occurred',
      };

      render(
        <ToastContainer
          notifications={[errorNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  describe('Stacking', () => {
    it('renders multiple notifications', () => {
      const notifications: Notification[] = [
        baseNotification,
        { ...baseNotification, id: 'test-2', message: 'Second notification' },
        { ...baseNotification, id: 'test-3', message: 'Third notification' },
      ];

      render(
        <ToastContainer
          notifications={notifications}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('Test notification')).toBeInTheDocument();
      expect(screen.getByText('Second notification')).toBeInTheDocument();
      expect(screen.getByText('Third notification')).toBeInTheDocument();
    });

    it('respects maxVisible prop', () => {
      const notifications: Notification[] = [
        baseNotification,
        { ...baseNotification, id: 'test-2', message: 'Second' },
        { ...baseNotification, id: 'test-3', message: 'Third' },
        { ...baseNotification, id: 'test-4', message: 'Fourth' },
        { ...baseNotification, id: 'test-5', message: 'Fifth' },
        { ...baseNotification, id: 'test-6', message: 'Sixth' },
      ];

      render(
        <ToastContainer
          notifications={notifications}
          onDismiss={mockDismiss}
          maxVisible={3}
        />
      );

      expect(screen.getByText('Test notification')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
      expect(screen.queryByText('Sixth')).not.toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('auto-dismisses after duration', () => {
      const notificationWithDuration: Notification = {
        ...baseNotification,
        duration: 3000,
      };

      render(
        <ToastContainer
          notifications={[notificationWithDuration]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('Test notification')).toBeInTheDocument();

      vi.advanceTimersByTime(3000);

      expect(mockDismiss).toHaveBeenCalledWith('test-1');
    });

    it('does not auto-dismiss when duration is 0', () => {
      const notificationNoDuration: Notification = {
        ...baseNotification,
        duration: 0,
      };

      render(
        <ToastContainer
          notifications={[notificationNoDuration]}
          onDismiss={mockDismiss}
        />
      );

      vi.advanceTimersByTime(10000);

      expect(screen.getByText('Test notification')).toBeInTheDocument();
      expect(mockDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Dismiss', () => {
    it('renders dismiss button when dismissible is true', () => {
      const dismissibleNotification: Notification = {
        ...baseNotification,
        dismissible: true,
      };

      render(
        <ToastContainer
          notifications={[dismissibleNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      render(
        <ToastContainer
          notifications={[baseNotification]}
          onDismiss={mockDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: 'Dismiss notification' });
      fireEvent.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalledWith('test-1');
    });

    it('does not render dismiss button when dismissible is false', () => {
      const nonDismissibleNotification: Notification = {
        ...baseNotification,
        dismissible: false,
      };

      render(
        <ToastContainer
          notifications={[nonDismissibleNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.queryByRole('button', { name: 'Dismiss notification' })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(
        <ToastContainer
          notifications={[baseNotification]}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
