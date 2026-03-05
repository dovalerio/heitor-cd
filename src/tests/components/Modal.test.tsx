import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modal } from '../../renderer/components/Modal/Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Modal',
    onClose: vi.fn(),
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is NOT rendered when isOpen=false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is rendered when isOpen=true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the title in an h2 element', () => {
    render(<Modal {...defaultProps} title="My Title" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('My Title');
  });

  it('renders children inside the modal', () => {
    render(<Modal {...defaultProps}><p>Custom child content</p></Modal>);
    expect(screen.getByText('Custom child content')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(<Modal {...defaultProps} footer={<button>Confirm</button>} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('does not render footer section when not provided', () => {
    render(<Modal {...defaultProps} footer={undefined} />);
    // Just ensure it doesn't crash, the footer div is conditionally rendered
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Fechar modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    const onClose = vi.fn();
    const { container } = render(<Modal {...defaultProps} onClose={onClose} />);
    // The backdrop is the outermost div with role="presentation"
    const backdrop = container.querySelector('[role="presentation"]') as HTMLElement;
    // Click the backdrop itself (not the dialog inside)
    fireEvent.click(backdrop, { target: backdrop });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking inside dialog does NOT call onClose', async () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    // Click somewhere inside the dialog content
    fireEvent.click(screen.getByText('Modal content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has role="dialog" on dialog element', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('aria-label matches the title prop', () => {
    render(<Modal {...defaultProps} title="Specific Title" />);
    expect(screen.getByRole('dialog', { name: 'Specific Title' })).toBeInTheDocument();
  });

  it('focus trap: Tab on last focusable button wraps to first', () => {
    render(
      <Modal
        {...defaultProps}
        footer={<button type="button">Confirm</button>}
      />
    );
    // Advance timers for setTimeout in the useEffect focus logic
    act(() => { vi.runAllTimers(); });

    const buttons = screen.getAllByRole('button');
    // Last button should be "Confirm", focus it
    const lastButton = buttons[buttons.length - 1];
    lastButton.focus();
    expect(document.activeElement).toBe(lastButton);

    // Press Tab - should wrap to first button
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    // The first focusable element should receive focus
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('forwards data-testid to dialog element', () => {
    render(<Modal {...defaultProps} data-testid="test-modal" />);
    expect(screen.getByTestId('test-modal')).toBeInTheDocument();
  });
});
