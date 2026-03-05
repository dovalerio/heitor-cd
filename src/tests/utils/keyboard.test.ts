import { describe, it, expect } from 'vitest';
import { parseShortcut, matchesShortcut, shortcutToString } from '../../renderer/utils/keyboard';

describe('parseShortcut', () => {
  it('parses Ctrl+Shift+A correctly', () => {
    const result = parseShortcut('Ctrl+Shift+A');
    expect(result.ctrl).toBe(true);
    expect(result.shift).toBe(true);
    expect(result.alt).toBe(false);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('A');
  });

  it('parses Alt+Up using arrow key alias', () => {
    const result = parseShortcut('Alt+Up');
    expect(result.alt).toBe(true);
    expect(result.ctrl).toBe(false);
    expect(result.shift).toBe(false);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('ArrowUp');
  });

  it('parses Space -> key is a single space character', () => {
    const result = parseShortcut('Space');
    expect(result.key).toBe(' ');
    expect(result.ctrl).toBe(false);
    expect(result.alt).toBe(false);
    expect(result.shift).toBe(false);
    expect(result.meta).toBe(false);
  });

  it('parses Esc -> key is Escape', () => {
    const result = parseShortcut('Esc');
    expect(result.key).toBe('Escape');
  });

  it('parses F5 -> key is F5', () => {
    const result = parseShortcut('F5');
    expect(result.key).toBe('F5');
  });

  it('parses F12 -> key is F12', () => {
    const result = parseShortcut('F12');
    expect(result.key).toBe('F12');
  });

  it('parses Ctrl+Z (no shift/alt/meta)', () => {
    const result = parseShortcut('Ctrl+Z');
    expect(result.ctrl).toBe(true);
    expect(result.shift).toBe(false);
    expect(result.alt).toBe(false);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('Z');
  });

  it('parses Meta modifier (Cmd)', () => {
    const result = parseShortcut('Cmd+S');
    expect(result.meta).toBe(true);
    expect(result.ctrl).toBe(false);
    expect(result.key).toBe('S');
  });

  it('parses all four modifiers at once', () => {
    const result = parseShortcut('Ctrl+Alt+Shift+Meta+X');
    expect(result.ctrl).toBe(true);
    expect(result.alt).toBe(true);
    expect(result.shift).toBe(true);
    expect(result.meta).toBe(true);
    expect(result.key).toBe('X');
  });

  it('parses a plain key with no modifiers', () => {
    const result = parseShortcut('Enter');
    expect(result.ctrl).toBe(false);
    expect(result.alt).toBe(false);
    expect(result.shift).toBe(false);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('Enter');
  });

  it('parses Down arrow alias', () => {
    const result = parseShortcut('Ctrl+Down');
    expect(result.ctrl).toBe(true);
    expect(result.key).toBe('ArrowDown');
  });

  it('parses Left arrow alias', () => {
    const result = parseShortcut('Shift+Left');
    expect(result.shift).toBe(true);
    expect(result.key).toBe('ArrowLeft');
  });

  it('parses Right arrow alias', () => {
    const result = parseShortcut('Right');
    expect(result.key).toBe('ArrowRight');
  });

  it('parses Escape alias correctly', () => {
    const result = parseShortcut('Escape');
    expect(result.key).toBe('Escape');
  });

  it('parses Delete and Del alias', () => {
    expect(parseShortcut('Delete').key).toBe('Delete');
    expect(parseShortcut('Del').key).toBe('Delete');
  });

  it('parses Backspace', () => {
    const result = parseShortcut('Backspace');
    expect(result.key).toBe('Backspace');
  });

  it('parses Tab key', () => {
    const result = parseShortcut('Tab');
    expect(result.key).toBe('Tab');
  });

  it('handles Win modifier as meta', () => {
    const result = parseShortcut('Win+D');
    expect(result.meta).toBe(true);
    expect(result.key).toBe('D');
  });

  it('handles Control modifier alias', () => {
    const result = parseShortcut('Control+A');
    expect(result.ctrl).toBe(true);
    expect(result.key).toBe('A');
  });
});

describe('matchesShortcut', () => {
  const makeEvent = (
    key: string,
    opts: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean; metaKey?: boolean } = {},
  ): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key,
      ctrlKey: opts.ctrlKey ?? false,
      altKey: opts.altKey ?? false,
      shiftKey: opts.shiftKey ?? false,
      metaKey: opts.metaKey ?? false,
    });
  };

  it('matches when all modifiers and key match', () => {
    const shortcut = parseShortcut('Ctrl+Shift+A');
    const event = makeEvent('A', { ctrlKey: true, shiftKey: true });
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });

  it('fails when ctrl modifier differs', () => {
    const shortcut = parseShortcut('Ctrl+A');
    const event = makeEvent('A', { ctrlKey: false });
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it('fails when alt modifier differs', () => {
    const shortcut = parseShortcut('Alt+A');
    const event = makeEvent('A', { altKey: false });
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it('fails when shift modifier differs', () => {
    const shortcut = parseShortcut('Shift+S');
    const event = makeEvent('S', { shiftKey: false });
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it('fails when meta modifier differs', () => {
    const shortcut = parseShortcut('Meta+M');
    const event = makeEvent('M', { metaKey: false });
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it('fails when key does not match', () => {
    const shortcut = parseShortcut('Ctrl+A');
    const event = makeEvent('B', { ctrlKey: true });
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it('matches plain key with no modifiers', () => {
    const shortcut = parseShortcut('Escape');
    const event = makeEvent('Escape');
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });

  it('matches Space shortcut', () => {
    const shortcut = parseShortcut('Space');
    const event = makeEvent(' ');
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });

  it('fails when extra modifier pressed that shortcut does not require', () => {
    const shortcut = parseShortcut('Ctrl+S');
    const event = makeEvent('S', { ctrlKey: true, altKey: true });
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it('matches arrow key shortcut', () => {
    const shortcut = parseShortcut('Alt+Up');
    const event = makeEvent('ArrowUp', { altKey: true });
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });
});

describe('shortcutToString', () => {
  it('reconstructs Ctrl+Shift+A', () => {
    const shortcut = parseShortcut('Ctrl+Shift+A');
    expect(shortcutToString(shortcut)).toBe('Ctrl+Shift+A');
  });

  it('converts ArrowUp key back to Up', () => {
    const shortcut = parseShortcut('Alt+Up');
    const result = shortcutToString(shortcut);
    expect(result).toBe('Alt+Up');
  });

  it('converts space key back to Space', () => {
    const shortcut = parseShortcut('Space');
    expect(shortcutToString(shortcut)).toBe('Space');
  });

  it('converts Escape key back to Esc', () => {
    const shortcut = parseShortcut('Esc');
    expect(shortcutToString(shortcut)).toBe('Esc');
  });

  it('reconstructs Ctrl+Z', () => {
    const shortcut = parseShortcut('Ctrl+Z');
    expect(shortcutToString(shortcut)).toBe('Ctrl+Z');
  });

  it('reconstructs F5', () => {
    const shortcut = parseShortcut('F5');
    expect(shortcutToString(shortcut)).toBe('F5');
  });

  it('reconstructs all four modifiers', () => {
    const shortcut = parseShortcut('Ctrl+Alt+Shift+Meta+X');
    const result = shortcutToString(shortcut);
    expect(result).toContain('Ctrl');
    expect(result).toContain('Alt');
    expect(result).toContain('Shift');
    expect(result).toContain('Meta');
    expect(result).toContain('X');
  });

  it('converts ArrowDown back to Down', () => {
    const shortcut = parseShortcut('Ctrl+Down');
    expect(shortcutToString(shortcut)).toBe('Ctrl+Down');
  });

  it('converts ArrowLeft back to Left', () => {
    const shortcut = parseShortcut('Left');
    expect(shortcutToString(shortcut)).toBe('Left');
  });

  it('converts ArrowRight back to Right', () => {
    const shortcut = parseShortcut('Right');
    expect(shortcutToString(shortcut)).toBe('Right');
  });

  it('handles plain Enter key', () => {
    const shortcut = parseShortcut('Enter');
    expect(shortcutToString(shortcut)).toBe('Enter');
  });
});
