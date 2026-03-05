import React, { useState, useRef, useCallback } from 'react';
import { getTreeAriaProps, getTreeNodeAriaProps } from '@/utils/aria';
import styles from './Tree.module.css';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: React.ReactNode;
  data?: unknown;
}

export interface TreeProps {
  nodes: TreeNode[];
  label: string;
  onActivate?: (node: TreeNode) => void;
  onSelect?: (node: TreeNode) => void;
  onContextMenu?: (node: TreeNode, position: { x: number; y: number }) => void;
  'data-testid'?: string;
}

interface TreeNodeState {
  expanded: boolean;
  selected: boolean;
}

export const Tree: React.FC<TreeProps> = ({
  nodes,
  label,
  onActivate,
  onSelect,
  onContextMenu,
  'data-testid': testId,
}) => {
  const [nodeStates, setNodeStates] = useState<Record<string, TreeNodeState>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const treeRef = useRef<HTMLUListElement>(null);

  const getState = (id: string): TreeNodeState =>
    nodeStates[id] ?? { expanded: false, selected: false };

  const toggleExpand = useCallback((id: string) => {
    setNodeStates((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { expanded: false, selected: false }),
        expanded: !prev[id]?.expanded,
      },
    }));
  }, []);

  const toggleSelect = useCallback(
    (node: TreeNode) => {
      setNodeStates((prev) => ({
        ...prev,
        [node.id]: {
          ...(prev[node.id] ?? { expanded: false, selected: false }),
          selected: !prev[node.id]?.selected,
        },
      }));
      onSelect?.(node);
    },
    [onSelect],
  );

  const flatNodes = useCallback((): TreeNode[] => {
    const result: TreeNode[] = [];
    const traverse = (list: TreeNode[]) => {
      for (const n of list) {
        result.push(n);
        if (n.children?.length && nodeStates[n.id]?.expanded) {
          traverse(n.children);
        }
      }
    };
    traverse(nodes);
    return result;
  }, [nodes, nodeStates]);

  const handleKeyDown = (e: React.KeyboardEvent, node: TreeNode) => {
    const flat = flatNodes();
    const idx = flat.findIndex((n) => n.id === node.id);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = flat[idx + 1];
        if (next) setFocusedId(next.id);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = flat[idx - 1];
        if (prev) setFocusedId(prev.id);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (node.children?.length && !getState(node.id).expanded) {
          toggleExpand(node.id);
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        if (getState(node.id).expanded) {
          toggleExpand(node.id);
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        onActivate?.(node);
        break;
      }
      case ' ': {
        e.preventDefault();
        toggleSelect(node);
        break;
      }
      default:
        break;
    }
  };

  const renderNodes = (list: TreeNode[], level: number, parentCount: number): React.ReactNode => {
    return list.map((node, index) => {
      const state = getState(node.id);
      const hasChildren = Boolean(node.children?.length);
      const ariaProps = getTreeNodeAriaProps(
        state.expanded,
        state.selected,
        level,
        index + 1,
        parentCount,
        node.label,
      );

      return (
        <li key={node.id} role="none" className={styles.nodeWrapper}>
          <div
            role={ariaProps.role}
            aria-expanded={hasChildren ? ariaProps['aria-expanded'] : undefined}
            aria-selected={ariaProps['aria-selected']}
            aria-level={ariaProps['aria-level']}
            aria-posinset={ariaProps['aria-posinset']}
            aria-setsize={ariaProps['aria-setsize']}
            aria-label={ariaProps['aria-label']}
            tabIndex={
              focusedId === node.id || (focusedId === null && index === 0 && level === 1) ? 0 : -1
            }
            className={[
              styles.node,
              state.selected ? styles.nodeSelected : '',
              focusedId === node.id ? styles.nodeFocused : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ paddingLeft: `${(level - 1) * 20 + 12}px` }}
            onClick={() => {
              setFocusedId(node.id);
              if (hasChildren) toggleExpand(node.id);
              else onActivate?.(node);
            }}
            onKeyDown={(e) => handleKeyDown(e, node)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu?.(node, { x: e.clientX, y: e.clientY });
            }}
          >
            {hasChildren && (
              <span className={styles.expandIcon} aria-hidden="true">
                {state.expanded ? '▼' : '▶'}
              </span>
            )}
            {!hasChildren && <span className={styles.leafIcon} aria-hidden="true" />}
            {node.icon && (
              <span className={styles.nodeIcon} aria-hidden="true">
                {node.icon}
              </span>
            )}
            <span className={styles.nodeLabel}>{node.label}</span>
          </div>
          {hasChildren && state.expanded && (
            <ul role="group" className={styles.children}>
              {renderNodes(node.children!, level + 1, node.children!.length)}
            </ul>
          )}
        </li>
      );
    });
  };

  const treeAriaProps = getTreeAriaProps(label, false);

  return (
    <ul
      ref={treeRef}
      role={treeAriaProps.role}
      aria-label={treeAriaProps['aria-label']}
      aria-multiselectable={treeAriaProps['aria-multiselectable']}
      className={styles.tree}
      data-testid={testId}
    >
      {renderNodes(nodes, 1, nodes.length)}
    </ul>
  );
};
