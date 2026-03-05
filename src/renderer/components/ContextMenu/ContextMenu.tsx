import React, { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  separator?: never;
}

export interface ContextMenuSeparator {
  id: string;
  separator: true;
  label?: never;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

export interface ContextMenuProps {
  items: ContextMenuEntry[];
  position: { x: number; y: number };
  onSelect: (id: string) => void;
  onClose: () => void;
  'data-testid'?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onSelect,
  onClose,
  'data-testid': testId,
}) => {
  const menuRef = useRef<HTMLUListElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstItemRef.current?.focus();

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const actionItems = items.filter((i): i is ContextMenuItem => !('separator' in i && i.separator));

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if (!buttons) return;
    const arr = Array.from(buttons);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      arr[(index + 1) % arr.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      arr[(index - 1 + arr.length) % arr.length]?.focus();
    }
  };

  let actionIndex = -1;

  // Clamp position to viewport
  const style: React.CSSProperties = {
    top: Math.min(position.y, window.innerHeight - 200),
    left: Math.min(position.x, window.innerWidth - 200),
  };

  return (
    <ul
      ref={menuRef}
      role="menu"
      aria-label="Context menu"
      className={styles.menu}
      style={style}
      data-testid={testId}
    >
      {items.map((item) => {
        if ('separator' in item && item.separator) {
          return <li key={item.id} role="separator" className={styles.separator} />;
        }

        const menuItem = item as ContextMenuItem;
        actionIndex++;
        const currentIndex = actionIndex;

        return (
          <li key={menuItem.id} role="none">
            <button
              ref={currentIndex === 0 ? firstItemRef : undefined}
              role="menuitem"
              className={[
                styles.item,
                menuItem.danger ? styles.itemDanger : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={menuItem.disabled}
              onClick={() => {
                onSelect(menuItem.id);
                onClose();
              }}
              onKeyDown={(e) => handleKeyDown(e, currentIndex)}
              type="button"
            >
              {menuItem.icon && (
                <span className={styles.itemIcon} aria-hidden="true">
                  {menuItem.icon}
                </span>
              )}
              {menuItem.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
