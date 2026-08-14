import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  describe('Text Formatting', () => {
    it('renders plain text', () => {
      render(<MarkdownRenderer content="Hello world" />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders bold text with **', () => {
      render(<MarkdownRenderer content="This is **bold** text" />);
      expect(screen.getByText('bold')).toBeInTheDocument();
      const boldElement = screen.getByText('bold');
      expect(boldElement.tagName.toLowerCase()).toBe('strong');
    });

    it('renders bold text with __', () => {
      render(<MarkdownRenderer content="This is __bold__ text" />);
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    it('renders italic text with *', () => {
      render(<MarkdownRenderer content="This is *italic* text" />);
      expect(screen.getByText('italic')).toBeInTheDocument();
      const italicElement = screen.getByText('italic');
      expect(italicElement.tagName.toLowerCase()).toBe('em');
    });

    it('renders italic text with _', () => {
      render(<MarkdownRenderer content="This is _italic_ text" />);
      expect(screen.getByText('italic')).toBeInTheDocument();
    });

    it('renders inline code with backticks', () => {
      render(<MarkdownRenderer content="Use `code` here" />);
      const codeElement = screen.getByText('code');
      expect(codeElement.tagName.toLowerCase()).toBe('code');
    });
  });

  describe('Links', () => {
    it('renders links', () => {
      render(<MarkdownRenderer content="Visit [Google](https://google.com)" />);
      const link = screen.getByRole('link', { name: 'Google' });
      expect(link).toHaveAttribute('href', 'https://google.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('respects custom link target option', () => {
      render(
        <MarkdownRenderer
          content="Visit [Link](https://example.com)"
          options={{ linkTarget: '_self' }}
        />
      );
      const link = screen.getByRole('link', { name: 'Link' });
      expect(link).toHaveAttribute('target', '_self');
    });
  });

  describe('Lists', () => {
    it('renders unordered lists', () => {
      render(<MarkdownRenderer content="- Item 1\n- Item 2\n- Item 3" />);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('renders ordered lists', () => {
      render(<MarkdownRenderer content="1. First\n2. Second\n3. Third" />);
      const list = screen.getByRole('list');
      expect(list.tagName.toLowerCase()).toBe('ol');
    });
  });

  describe('Accessibility', () => {
    it('has role document', () => {
      render(<MarkdownRenderer content="Test content" />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <MarkdownRenderer content="Test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(<MarkdownRenderer content="" />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('handles malformed markdown gracefully', () => {
      render(<MarkdownRenderer content="**unclosed bold" />);
      expect(screen.getByText('**unclosed bold')).toBeInTheDocument();
    });
  });
});
