import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeLayout } from '../HomeLayout';

describe('HomeLayout', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render layout', () => {
    render(<HomeLayout {...defaultProps} />);
    expect(document.querySelector('.home-layout')).toBeInTheDocument();
  });

  it('should display header with title', () => {
    render(<HomeLayout {...defaultProps} />);
    const titleElements = screen.getAllByText('PEAAI');
    expect(titleElements.length).toBeGreaterThan(0);
  });

  it('should have menu button in header', () => {
    render(<HomeLayout {...defaultProps} />);
    const menuButton = screen.getByRole('button', { name: 'Toggle sidebar' });
    expect(menuButton).toBeInTheDocument();
  });

  it('should have chat toggle button in header', () => {
    render(<HomeLayout {...defaultProps} />);
    const chatToggle = screen.getByRole('button', { name: 'Toggle chat panel' });
    expect(chatToggle).toBeInTheDocument();
  });

  it('should have canvas area', () => {
    render(<HomeLayout {...defaultProps} />);
    expect(document.querySelector('.home-layout__canvas')).toBeInTheDocument();
  });

  it('should have navigation sidebar', () => {
    render(<HomeLayout {...defaultProps} />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('should have chat panel', () => {
    render(<HomeLayout {...defaultProps} />);
    expect(screen.getByRole('region', { name: 'Chat panel' })).toBeInTheDocument();
  });

  it('should call onNavigate when navigation item is clicked', () => {
    render(<HomeLayout {...defaultProps} />);
    const homeNavItem = screen.getByText('Home');
    fireEvent.click(homeNavItem);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/');
  });

  it('should call onNavigate when chat navigation item is clicked', () => {
    render(<HomeLayout {...defaultProps} />);
    const chatNavItems = screen.getAllByText('Chat');
    // First Chat is in the nav menu
    fireEvent.click(chatNavItems[0]);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/chat');
  });

  it('should render children content', () => {
    render(
      <HomeLayout {...defaultProps}>
        <div data-testid="child-content">Test Child</div>
      </HomeLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<HomeLayout {...defaultProps} className="custom-class" />);
    const layout = document.querySelector('.home-layout');
    expect(layout).toHaveClass('custom-class');
  });

  it('should set data-breakpoint attribute', () => {
    render(<HomeLayout {...defaultProps} />);
    const layout = document.querySelector('.home-layout');
    expect(layout).toHaveAttribute('data-breakpoint');
  });
});
