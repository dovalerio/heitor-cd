import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tree, TreeNode } from '../../renderer/components/Tree/Tree';

const rootNodes: TreeNode[] = [
  {
    id: 'node-1',
    label: 'Node 1',
    children: [
      { id: 'node-1-1', label: 'Node 1.1' },
      { id: 'node-1-2', label: 'Node 1.2' },
    ],
  },
  { id: 'node-2', label: 'Node 2' },
  { id: 'node-3', label: 'Node 3' },
];

describe('Tree', () => {
  it('renders all root nodes', () => {
    render(<Tree nodes={rootNodes} label="My Tree" />);
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Node 2')).toBeInTheDocument();
    expect(screen.getByText('Node 3')).toBeInTheDocument();
  });

  it('has role="tree" on root element', () => {
    render(<Tree nodes={rootNodes} label="My Tree" />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('aria-label on tree matches label prop', () => {
    render(<Tree nodes={rootNodes} label="My Special Tree" />);
    expect(screen.getByRole('tree', { name: 'My Special Tree' })).toBeInTheDocument();
  });

  it('nodes have role="treeitem"', () => {
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const treeItems = screen.getAllByRole('treeitem');
    expect(treeItems.length).toBeGreaterThanOrEqual(3);
  });

  it('ArrowRight on a parent node expands it and shows children', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });

    // Children should not be visible initially
    expect(screen.queryByText('Node 1.1')).not.toBeInTheDocument();

    node1.focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByText('Node 1.1')).toBeInTheDocument();
    expect(screen.getByText('Node 1.2')).toBeInTheDocument();
  });

  it('ArrowLeft collapses an expanded node', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });

    // First expand
    node1.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Node 1.1')).toBeInTheDocument();

    // Then collapse
    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByText('Node 1.1')).not.toBeInTheDocument();
  });

  it('ArrowDown moves focus to the next node', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);

    // Focus the first node
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    node1.focus();
    expect(document.activeElement).toBe(node1);

    await user.keyboard('{ArrowDown}');

    // After ArrowDown, node-2 should be the focused id (tabIndex=0)
    const node2 = screen.getByRole('treeitem', { name: 'Node 2' });
    expect(node2).toHaveAttribute('tabindex', '0');
  });

  it('ArrowUp moves focus to the previous node', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);

    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    const node2 = screen.getByRole('treeitem', { name: 'Node 2' });

    // Move to node 2 first
    node1.focus();
    await user.keyboard('{ArrowDown}');
    expect(node2).toHaveAttribute('tabindex', '0');

    // Now ArrowUp should go back to node 1
    node2.focus();
    await user.keyboard('{ArrowUp}');
    expect(node1).toHaveAttribute('tabindex', '0');
  });

  it('Enter calls onActivate with the node', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<Tree nodes={rootNodes} label="My Tree" onActivate={onActivate} />);

    const node2 = screen.getByRole('treeitem', { name: 'Node 2' });
    node2.focus();
    await user.keyboard('{Enter}');

    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'node-2', label: 'Node 2' }));
  });

  it('Space calls onSelect with the node', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Tree nodes={rootNodes} label="My Tree" onSelect={onSelect} />);

    const node2 = screen.getByRole('treeitem', { name: 'Node 2' });
    node2.focus();
    await user.keyboard(' ');

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'node-2', label: 'Node 2' }));
  });

  it('expanded node shows children', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);

    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    node1.focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByText('Node 1.1')).toBeInTheDocument();
    expect(screen.getByText('Node 1.2')).toBeInTheDocument();
  });

  it('parent node has aria-expanded=false initially', () => {
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    expect(node1).toHaveAttribute('aria-expanded', 'false');
  });

  it('parent node has aria-expanded=true after expansion', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    node1.focus();
    await user.keyboard('{ArrowRight}');
    expect(node1).toHaveAttribute('aria-expanded', 'true');
  });

  it('leaf node does not have aria-expanded attribute', () => {
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const node2 = screen.getByRole('treeitem', { name: 'Node 2' });
    expect(node2).not.toHaveAttribute('aria-expanded');
  });

  it('aria-level is set correctly for root nodes (level 1)', () => {
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    expect(node1).toHaveAttribute('aria-level', '1');
  });

  it('aria-level is 2 for child nodes', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);

    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    node1.focus();
    await user.keyboard('{ArrowRight}');

    const child1 = screen.getByRole('treeitem', { name: 'Node 1.1' });
    expect(child1).toHaveAttribute('aria-level', '2');
  });

  it('forwards data-testid', () => {
    render(<Tree nodes={rootNodes} label="My Tree" data-testid="my-tree" />);
    expect(screen.getByTestId('my-tree')).toBeInTheDocument();
  });

  it('clicking a parent node expands it', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={rootNodes} label="My Tree" />);
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    await user.click(node1);
    expect(screen.getByText('Node 1.1')).toBeInTheDocument();
  });

  it('clicking a leaf node calls onActivate', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<Tree nodes={rootNodes} label="My Tree" onActivate={onActivate} />);
    const node2 = screen.getByRole('treeitem', { name: 'Node 2' });
    await user.click(node2);
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'node-2' }));
  });
});
