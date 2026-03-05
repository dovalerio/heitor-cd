import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Toggle } from '../../renderer/components/Toggle/Toggle';

describe('Toggle', () => {
  const defaultProps = {
    label: 'Enable feature',
    checked: false,
    onChange: vi.fn(),
  };

  it('renders label text', () => {
    render(<Toggle {...defaultProps} />);
    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('calls onChange with !checked when clicked (unchecked -> checked)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} checked={false} onChange={handleChange} />);
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with !checked when clicked (checked -> unchecked)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} checked={true} onChange={handleChange} />);
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('calls onChange when Space key is pressed', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} onChange={handleChange} />);
    const toggle = screen.getByRole('switch');
    toggle.focus();
    await user.keyboard(' ');
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} onChange={handleChange} />);
    const toggle = screen.getByRole('switch');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('aria-checked matches checked prop (false)', () => {
    render(<Toggle {...defaultProps} checked={false} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('aria-checked matches checked prop (true)', () => {
    render(<Toggle {...defaultProps} checked={true} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('has role="switch"', () => {
    render(<Toggle {...defaultProps} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('aria-disabled is true when disabled', () => {
    render(<Toggle {...defaultProps} disabled />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does NOT call onChange when disabled and clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} disabled onChange={handleChange} />);
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does NOT call onChange when disabled and Space pressed', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} disabled onChange={handleChange} />);
    const toggle = screen.getByRole('switch');
    // tabIndex is -1 when disabled, but we still fire keydown directly
    fireEvent.keyDown(toggle, { key: ' ' });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('forwards data-testid', () => {
    render(<Toggle {...defaultProps} data-testid="my-toggle" />);
    expect(screen.getByTestId('my-toggle')).toBeInTheDocument();
  });

  it('aria-label matches label prop', () => {
    render(<Toggle {...defaultProps} label="My Toggle" />);
    expect(screen.getByRole('switch', { name: 'My Toggle' })).toBeInTheDocument();
  });
});
