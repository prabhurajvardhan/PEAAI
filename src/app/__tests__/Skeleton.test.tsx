import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCard } from '../components/Skeleton';

describe('Skeleton', () => {
  it('renders with default dimensions', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with custom width and height', () => {
    const { container } = render(<Skeleton width="100px" height="50px" />);
    const skeleton = container.querySelector('div > div') as HTMLElement;
    expect(skeleton).toBeInTheDocument();
  });

  it('renders text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    const skeleton = container.querySelector('div > div') as HTMLElement;
    expect(skeleton).toBeInTheDocument();
  });

  it('renders circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.querySelector('div > div') as HTMLElement;
    expect(skeleton).toBeInTheDocument();
  });

  it('renders rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const skeleton = container.querySelector('div > div') as HTMLElement;
    expect(skeleton).toBeInTheDocument();
  });
});

describe('SkeletonText', () => {
  it('renders default lines', () => {
    const { container } = render(<SkeletonText />);
    // SkeletonText renders lines inside divs
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });

  it('renders custom number of lines', () => {
    const { container } = render(<SkeletonText lines={5} />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });
});

describe('SkeletonCard', () => {
  it('renders with content', () => {
    const { container } = render(<SkeletonCard />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });

  it('renders without avatar', () => {
    const { container } = render(<SkeletonCard showAvatar={false} />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });
});
