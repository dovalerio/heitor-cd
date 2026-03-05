import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './CommandPalette.module.css';

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  'data-testid'?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  'data-testid': testId,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const execute = useCallback(
    (cmd: Command) => {
      cmd.action();
      onClose();
    },
    [onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) execute(filtered[activeIndex]);
        break;
      default:
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector('[aria-selected="true"]') as HTMLElement;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Paleta de comandos"
        aria-modal="true"
        className={styles.palette}
        data-testid={testId}
      >
        <div className={styles.searchWrapper}>
          <input
            ref={inputRef}
            type="search"
            className={styles.search}
            placeholder="Digite um comando..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Buscar comando"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={
              filtered[activeIndex] ? `cmd-${filtered[activeIndex].id}` : undefined
            }
            role="combobox"
            aria-expanded={filtered.length > 0}
          />
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty} role="status">
            Nenhum comando encontrado.
          </p>
        ) : (
          <ul
            ref={listRef}
            id="command-list"
            role="listbox"
            aria-label="Comandos disponíveis"
            className={styles.list}
          >
            {filtered.map((cmd, index) => (
              <li
                key={cmd.id}
                id={`cmd-${cmd.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={[styles.item, index === activeIndex ? styles.itemActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => execute(cmd)}
              >
                <span className={styles.itemLabel}>{cmd.label}</span>
                {cmd.description && (
                  <span className={styles.itemDescription}>{cmd.description}</span>
                )}
                {cmd.shortcut && (
                  <kbd className={styles.itemShortcut}>{cmd.shortcut}</kbd>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
