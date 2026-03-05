import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../renderer/components/Button/Button';

describe('Button', () => {
  it('renders label text', () => {
    render(<Button label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} disabled />);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('aria-label matches label prop', () => {
    render(<Button label="My Label" />);
    expect(screen.getByRole('button', { name: 'My Label' })).toBeInTheDocument();
  });

  it('aria-disabled is true when disabled', () => {
    render(<Button label="Disabled" disabled />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('aria-pressed is set when pressed prop is given', () => {
    render(<Button label="Toggle" pressed={true} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('aria-pressed is false when pressed=false', () => {
    render(<Button label="Toggle" pressed={false} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders icon if provided and icon span has aria-hidden', () => {
    const icon = <svg data-testid="icon-svg" />;
    render(<Button label="With Icon" icon={icon} />);
    expect(screen.getByTestId('icon-svg')).toBeInTheDocument();
    const iconSpan = screen.getByTestId('icon-svg').parentElement;
    expect(iconSpan).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render icon span when no icon provided', () => {
    render(<Button label="No Icon" />);
    // Should only have one span (the label span)
    const btn = screen.getByRole('button');
    const spans = btn.querySelectorAll('span');
    expect(spans).toHaveLength(1);
  });

  it('applies variant danger class to className', () => {
    render(<Button label="Danger" variant="danger" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('danger');
  });

  it('applies size sm class to className', () => {
    render(<Button label="Small" size="sm" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('sm');
  });

  it('applies size lg class to className', () => {
    render(<Button label="Large" size="lg" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('lg');
  });

  it('applies fullWidth class when fullWidth=true', () => {
    render(<Button label="Full" fullWidth />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('fullWidth');
  });

  it('does not apply fullWidth class when fullWidth=false', () => {
    render(<Button label="Not Full" fullWidth={false} />);
    const btn = screen.getByRole('button');
    expect(btn.className).not.toContain('fullWidth');
  });

  it('renders as submit button when type="submit"', () => {
    render(<Button label="Submit" type="submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('forwards data-testid', () => {
    render(<Button label="Test" data-testid="my-btn" />);
    expect(screen.getByTestId('my-btn')).toBeInTheDocument();
  });
});
