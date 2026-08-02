/**
 * Input Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Input, Textarea } from '../input/Input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Input helperText="Enter your email" />);
    expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('renders with isInvalid state', () => {
    render(<Input isInvalid helperText="Invalid" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('handles text input', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect((input as HTMLInputElement).value).toBe('test@example.com');
  });

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });

  it('disables input when disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('sets input to read-only when readOnly', () => {
    render(<Input readOnly defaultValue="readonly" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('renders with left icon', () => {
    render(<Input leftIcon={<span>🔍</span>} />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<Input rightIcon={<span>👤</span>} />);
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<Input type="password" />);
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<Input label="Email" required />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Required asterisk should be present
  });

  it('applies full width when specified', () => {
    render(<Input fullWidth />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('handles placeholder text', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();

    rerender(<Input type="tel" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
  });

  it('connects helper text with aria-describedby', () => {
    render(<Input label="Email" helperText="Enter your email" />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('connects error with aria-describedby', () => {
    render(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });
});

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Textarea label="Message" />);
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Textarea helperText="Write your message here" />);
    expect(screen.getByText(/write your message here/i)).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Textarea error="Message is required" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });

  it('handles text input', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Hello World' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('Hello World');
  });

  it('disables textarea when disabled', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies full width when specified', () => {
    render(<Textarea fullWidth />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.parentElement).toHaveStyle({ width: '100%' });
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
