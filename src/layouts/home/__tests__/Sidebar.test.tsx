import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeSidebar } from '../Sidebar';

describe('HomeSidebar', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sidebar when open', () => {
    render(<HomeSidebar {...defaultProps} />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('should display PEAAI logo', () => {
    render(<HomeSidebar {...defaultProps} />);
    expect(screen.getByText('PEAAI')).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(<HomeSidebar {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: 'Close sidebar' });
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<HomeSidebar {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: 'Close sidebar' });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should have navigation items', () => {
    render(<HomeSidebar {...defaultProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should call onNavigate when nav item is clicked', () => {
    render(<HomeSidebar {...defaultProps} />);
    const homeNavItem = screen.getByText('Home');
    fireEvent.click(homeNavItem);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/');
  });

  it('should call onNavigate with correct route for Chat', () => {
    render(<HomeSidebar {...defaultProps} />);
    const chatNavItem = screen.getByText('Chat');
    fireEvent.click(chatNavItem);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/chat');
  });

  it('should call onNavigate with correct route for Stories', () => {
    render(<HomeSidebar {...defaultProps} />);
    const storiesNavItem = screen.getByText('Stories');
    fireEvent.click(storiesNavItem);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/stories');
  });

  it('should call onNavigate with correct route for Settings', () => {
    render(<HomeSidebar {...defaultProps} />);
    const settingsNavItem = screen.getByText('Settings');
    fireEvent.click(settingsNavItem);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/settings');
  });

  it('should have overlay when open', () => {
    render(<HomeSidebar {...defaultProps} />);
    const overlay = document.querySelector('.home-sidebar__overlay--visible');
    expect(overlay).toBeInTheDocument();
  });

  it('should call onClose when overlay is clicked', () => {
    render(<HomeSidebar {...defaultProps} />);
    const overlay = document.querySelector('.home-sidebar__overlay--visible');
    if (overlay) {
      fireEvent.click(overlay);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });
});
