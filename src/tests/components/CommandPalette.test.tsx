import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommandPalette, Command } from '../../renderer/components/CommandPalette/CommandPalette';

const mockCommands: Command[] = [
  {
    id: 'cmd-1',
    label: 'Start Container',
    description: 'Start a Docker container',
    action: vi.fn(),
  },
  {
    id: 'cmd-2',
    label: 'Stop Container',
    description: 'Stop a running container',
    action: vi.fn(),
  },
  { id: 'cmd-3', label: 'Pull Image', description: 'Pull a Docker image', action: vi.fn() },
];

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is NOT rendered when isOpen=false', () => {
    render(<CommandPalette isOpen={false} onClose={vi.fn()} commands={mockCommands} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is rendered when isOpen=true', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('input is focused when isOpen=true (after timer)', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    act(() => {
      vi.runAllTimers();
    });
    const input = screen.getByRole('combobox');
    expect(document.activeElement).toBe(input);
  });

  it('filtering: typing narrows the displayed list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    act(() => {
      vi.runAllTimers();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Pull');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Pull Image');
  });

  it('Enter on active item calls its action and onClose', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    const onClose = vi.fn();
    const action = vi.fn();
    const commands: Command[] = [{ id: 'cmd-1', label: 'My Command', action }];
    render(<CommandPalette isOpen={true} onClose={onClose} commands={commands} />);
    act(() => {
      vi.runAllTimers();
    });

    const input = screen.getByRole('combobox');
    input.focus();
    await user.keyboard('{Enter}');

    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape calls onClose', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={mockCommands} />);
    act(() => {
      vi.runAllTimers();
    });

    const input = screen.getByRole('combobox');
    input.focus();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ArrowDown moves active index down', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    act(() => {
      vi.runAllTimers();
    });

    const input = screen.getByRole('combobox');
    input.focus();

    // Initially first item is active (aria-selected=true)
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('{ArrowDown}');

    const updatedOptions = screen.getAllByRole('option');
    expect(updatedOptions[0]).toHaveAttribute('aria-selected', 'false');
    expect(updatedOptions[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowUp does not go below index 0 (no underflow)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    act(() => {
      vi.runAllTimers();
    });

    const input = screen.getByRole('combobox');
    input.focus();

    // Already at index 0, pressing ArrowUp should stay at 0
    await user.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('shows empty state message when no matches', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    act(() => {
      vi.runAllTimers();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'ZZZNOMATCH');

    expect(screen.getByText('Nenhum comando encontrado.')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('aria-selected is true on the active item', async () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    act(() => {
      vi.runAllTimers();
    });

    const options = screen.getAllByRole('option');
    // First item should be active by default
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('role="listbox" on the list element', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('role="option" on list items', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
  });

  it('clicking an item calls action and onClose', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    const onClose = vi.fn();
    const action = vi.fn();
    const commands: Command[] = [{ id: 'cmd-a', label: 'Alpha Command', action }];
    render(<CommandPalette isOpen={true} onClose={onClose} commands={commands} />);
    act(() => {
      vi.runAllTimers();
    });

    await user.click(screen.getByRole('option', { name: /Alpha Command/ }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('forwards data-testid to the dialog wrapper', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        commands={mockCommands}
        data-testid="cmd-palette"
      />,
    );
    expect(screen.getByTestId('cmd-palette')).toBeInTheDocument();
  });

  it('description is shown alongside the label', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);
    expect(screen.getByText('Start a Docker container')).toBeInTheDocument();
  });
});
