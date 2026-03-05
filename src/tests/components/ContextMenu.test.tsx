import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextMenu, ContextMenuEntry } from '../../renderer/components/ContextMenu/ContextMenu';

const defaultItems: ContextMenuEntry[] = [
  { id: 'start', label: 'Start' },
  { id: 'stop', label: 'Stop' },
  { id: 'sep-1', separator: true },
  { id: 'remove', label: 'Remove', danger: true },
];

const defaultPosition = { x: 100, y: 100 };

describe('ContextMenu', () => {
  it('renders all action items as role="menuitem"', () => {
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(3); // start, stop, remove
  });

  it('renders separator items as role="separator"', () => {
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(1);
  });

  it('click on item calls onSelect with item id and then onClose', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    await user.click(screen.getByRole('menuitem', { name: 'Start' }));
    expect(onSelect).toHaveBeenCalledWith('start');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape key calls onClose', () => {
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('click outside the menu calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ContextMenu
          items={defaultItems}
          position={defaultPosition}
          onSelect={vi.fn()}
          onClose={onClose}
        />
      </div>
    );
    // Fire mousedown outside the menu
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disabled item has disabled attribute', () => {
    const items: ContextMenuEntry[] = [
      { id: 'action', label: 'Action', disabled: true },
    ];
    render(
      <ContextMenu
        items={items}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const btn = screen.getByRole('menuitem', { name: 'Action' });
    expect(btn).toBeDisabled();
  });

  it('danger item has danger class applied', () => {
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const removeBtn = screen.getByRole('menuitem', { name: 'Remove' });
    expect(removeBtn.className).toContain('itemDanger');
  });

  it('ArrowDown moves focus to next item', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const startBtn = screen.getByRole('menuitem', { name: 'Start' });
    const stopBtn = screen.getByRole('menuitem', { name: 'Stop' });

    startBtn.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(stopBtn);
  });

  it('ArrowUp moves focus to previous item', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const startBtn = screen.getByRole('menuitem', { name: 'Start' });
    const stopBtn = screen.getByRole('menuitem', { name: 'Stop' });

    stopBtn.focus();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(startBtn);
  });

  it('ArrowDown wraps from last to first item', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const startBtn = screen.getByRole('menuitem', { name: 'Start' });
    const removeBtn = screen.getByRole('menuitem', { name: 'Remove' });

    removeBtn.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(startBtn);
  });

  it('first item gets focus on mount', () => {
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const startBtn = screen.getByRole('menuitem', { name: 'Start' });
    expect(document.activeElement).toBe(startBtn);
  });

  it('forwards data-testid', () => {
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        data-testid="context-menu"
      />
    );
    expect(screen.getByTestId('context-menu')).toBeInTheDocument();
  });

  it('renders label text for each action item', () => {
    render(
      <ContextMenu
        items={defaultItems}
        position={defaultPosition}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });
});
