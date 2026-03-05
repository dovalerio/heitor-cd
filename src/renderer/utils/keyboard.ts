/**
 * keyboard.ts - Keyboard shortcut parsing and matching utilities
 */

import type { ParsedShortcut } from '../../types/keymap';

// Re-export the type so consumers can import from this module
export type { ParsedShortcut };

/**
 * Normalises a raw key token into the value used by KeyboardEvent.key.
 * Handles common aliases like "Esc", "Space", "Up", "Down", etc.
 */
const normaliseKey = (raw: string): string => {
  const aliases: Record<string, string> = {
    esc: 'Escape',
    escape: 'Escape',
    space: ' ',
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
    enter: 'Enter',
    return: 'Enter',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
    del: 'Delete',
    insert: 'Insert',
    ins: 'Insert',
    home: 'Home',
    end: 'End',
    pageup: 'PageUp',
    pgup: 'PageUp',
    pagedown: 'PageDown',
    pgdn: 'PageDown',
    pgdown: 'PageDown',
    capslock: 'CapsLock',
    numlock: 'NumLock',
    scrolllock: 'ScrollLock',
    printscreen: 'PrintScreen',
    pause: 'Pause',
    contextmenu: 'ContextMenu',
    plus: '+',
    minus: '-',
    equals: '=',
  };

  const lower = raw.toLowerCase();
  if (lower in aliases) {
    return aliases[lower];
  }

  // Function keys: F1..F12
  if (/^f\d{1,2}$/.test(lower)) {
    return raw.toUpperCase();
  }

  // Single character keys: preserve original capitalisation
  return raw;
};

/**
 * parseShortcut
 *
 * Parses a string like "Ctrl+Shift+A", "Alt+Up", "Space", "Esc", "F5"
 * and returns a structured ParsedShortcut object.
 *
 * Modifiers are case-insensitive. The final token is the key.
 */
export const parseShortcut = (shortcutStr: string): ParsedShortcut => {
  const tokens = shortcutStr.split('+').map((t) => t.trim());

  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;
  const keyTokens: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') {
      ctrl = true;
    } else if (lower === 'alt') {
      alt = true;
    } else if (lower === 'shift') {
      shift = true;
    } else if (lower === 'meta' || lower === 'cmd' || lower === 'command' || lower === 'win') {
      meta = true;
    } else {
      keyTokens.push(token);
    }
  }

  // The remaining token (after stripping modifiers) is the key.
  // If shortcutStr itself is "+" (e.g. "Ctrl+Plus" split gives empty last token),
  // keyTokens will be empty — treat the literal "+" as the key.
  const rawKey = keyTokens.length > 0 ? keyTokens.join('+') : '+';
  const key = normaliseKey(rawKey);

  return { ctrl, alt, shift, meta, key };
};

/**
 * matchesShortcut
 *
 * Returns true when a KeyboardEvent matches a ParsedShortcut.
 */
export const matchesShortcut = (event: KeyboardEvent, shortcut: ParsedShortcut): boolean => {
  if (event.ctrlKey !== shortcut.ctrl) return false;
  if (event.altKey !== shortcut.alt) return false;
  if (event.shiftKey !== shortcut.shift) return false;
  if (event.metaKey !== shortcut.meta) return false;

  // Compare normalised key values
  const eventKey = event.key;
  return eventKey === shortcut.key;
};

/**
 * shortcutToString
 *
 * Formats a ParsedShortcut back to a human-readable string,
 * e.g. { ctrl: true, shift: true, key: 'A' } -> "Ctrl+Shift+A"
 */
export const shortcutToString = (shortcut: ParsedShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('Meta');

  // Render the key in a readable form
  let keyLabel = shortcut.key;
  if (keyLabel === ' ') keyLabel = 'Space';
  else if (keyLabel === 'Escape') keyLabel = 'Esc';
  else if (keyLabel === 'ArrowUp') keyLabel = 'Up';
  else if (keyLabel === 'ArrowDown') keyLabel = 'Down';
  else if (keyLabel === 'ArrowLeft') keyLabel = 'Left';
  else if (keyLabel === 'ArrowRight') keyLabel = 'Right';

  parts.push(keyLabel);

  return parts.join('+');
};
