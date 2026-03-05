import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFocusableElements,
  trapFocus,
  moveFocusToFirst,
  moveFocusToLast,
  restoreFocus,
} from '../../renderer/utils/focus';

describe('getFocusableElements', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('returns buttons inside container', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Click';
    container.appendChild(btn);

    const result = getFocusableElements(container);
    expect(result).toContain(btn);
  });

  it('returns input elements', () => {
    const input = document.createElement('input');
    container.appendChild(input);

    const result = getFocusableElements(container);
    expect(result).toContain(input);
  });

  it('returns anchor tags with href', () => {
    const link = document.createElement('a');
    link.href = 'https://example.com';
    container.appendChild(link);

    const result = getFocusableElements(container);
    expect(result).toContain(link);
  });

  it('does not return anchor tags without href', () => {
    const link = document.createElement('a');
    container.appendChild(link);

    const result = getFocusableElements(container);
    expect(result).not.toContain(link);
  });

  it('excludes disabled buttons', () => {
    const btn = document.createElement('button');
    btn.disabled = true;
    container.appendChild(btn);

    const result = getFocusableElements(container);
    expect(result).not.toContain(btn);
  });

  it('excludes disabled inputs', () => {
    const input = document.createElement('input');
    input.disabled = true;
    container.appendChild(input);

    const result = getFocusableElements(container);
    expect(result).not.toContain(input);
  });

  it('includes elements with positive tabindex', () => {
    const div = document.createElement('div');
    div.setAttribute('tabindex', '0');
    container.appendChild(div);

    const result = getFocusableElements(container);
    expect(result).toContain(div);
  });

  it('excludes elements with tabindex=-1', () => {
    const div = document.createElement('div');
    div.setAttribute('tabindex', '-1');
    container.appendChild(div);

    const result = getFocusableElements(container);
    expect(result).not.toContain(div);
  });

  it('returns multiple focusable elements in DOM order', () => {
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const input = document.createElement('input');
    const btn2 = document.createElement('button');
    btn2.textContent = 'Last';
    container.appendChild(btn1);
    container.appendChild(input);
    container.appendChild(btn2);

    const result = getFocusableElements(container);
    expect(result[0]).toBe(btn1);
    expect(result[1]).toBe(input);
    expect(result[2]).toBe(btn2);
  });

  it('returns empty array when container has no focusable elements', () => {
    const div = document.createElement('div');
    container.appendChild(div);

    const result = getFocusableElements(container);
    expect(result).toHaveLength(0);
  });

  it('returns select elements', () => {
    const select = document.createElement('select');
    container.appendChild(select);

    const result = getFocusableElements(container);
    expect(result).toContain(select);
  });

  it('returns textarea elements', () => {
    const textarea = document.createElement('textarea');
    container.appendChild(textarea);

    const result = getFocusableElements(container);
    expect(result).toContain(textarea);
  });
});

describe('trapFocus', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const addButtons = (count: number): HTMLButtonElement[] => {
    return Array.from({ length: count }, (_, i) => {
      const btn = document.createElement('button');
      btn.textContent = `Button ${i + 1}`;
      container.appendChild(btn);
      return btn;
    });
  };

  it('Tab on last element wraps focus to first element', () => {
    const [first, , last] = addButtons(3);

    trapFocus(container);
    last.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: false,
      bubbles: true,
    });
    vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
  });

  it('Shift+Tab on first element wraps focus to last element', () => {
    const [first, , last] = addButtons(3);

    trapFocus(container);
    first.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);
  });

  it('returns a cleanup function that removes the keydown listener', () => {
    const [, , last] = addButtons(3);
    const cleanup = trapFocus(container);

    cleanup();

    last.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: false,
      bubbles: true,
    });
    container.dispatchEvent(event);

    // After cleanup, focus should NOT have wrapped
    expect(document.activeElement).toBe(last);
  });

  it('does not wrap for non-Tab keys', () => {
    const [first] = addButtons(2);
    trapFocus(container);
    first.focus();

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    container.dispatchEvent(event);

    expect(document.activeElement).toBe(first);
  });

  it('does nothing when there are no focusable elements', () => {
    trapFocus(container);
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    // Should not throw
    expect(() => container.dispatchEvent(event)).not.toThrow();
  });

  it('Shift+Tab when focus is outside container wraps to last element', () => {
    const [, , last] = addButtons(3);
    const outsideBtn = document.createElement('button');
    document.body.appendChild(outsideBtn);

    trapFocus(container);
    outsideBtn.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);

    document.body.removeChild(outsideBtn);
  });

  it('Tab when focus is outside container wraps to first element', () => {
    const [first] = addButtons(3);
    const outsideBtn = document.createElement('button');
    document.body.appendChild(outsideBtn);

    trapFocus(container);
    outsideBtn.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: false,
      bubbles: true,
    });
    vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);

    document.body.removeChild(outsideBtn);
  });
});

describe('moveFocusToFirst', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('focuses the first focusable element', () => {
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Second';
    container.appendChild(btn1);
    container.appendChild(btn2);

    moveFocusToFirst(container);

    expect(document.activeElement).toBe(btn1);
  });

  it('does nothing when no focusable elements exist', () => {
    // Should not throw
    expect(() => moveFocusToFirst(container)).not.toThrow();
  });
});

describe('moveFocusToLast', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('focuses the last focusable element', () => {
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Last';
    container.appendChild(btn1);
    container.appendChild(btn2);

    moveFocusToLast(container);

    expect(document.activeElement).toBe(btn2);
  });

  it('does nothing when no focusable elements exist', () => {
    expect(() => moveFocusToLast(container)).not.toThrow();
  });

  it('focuses the only element when there is one', () => {
    const btn = document.createElement('button');
    container.appendChild(btn);

    moveFocusToLast(container);

    expect(document.activeElement).toBe(btn);
  });
});

describe('restoreFocus', () => {
  it('calls focus on an element that is in the DOM', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    const focusSpy = vi.spyOn(btn, 'focus');

    restoreFocus(btn);

    expect(focusSpy).toHaveBeenCalledOnce();
    document.body.removeChild(btn);
  });

  it('does not throw when element is null', () => {
    expect(() => restoreFocus(null)).not.toThrow();
  });

  it('does not call focus when element is not in the DOM', () => {
    const btn = document.createElement('button');
    // Not appended to document
    const focusSpy = vi.spyOn(btn, 'focus');

    restoreFocus(btn);

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('does not throw when element was removed from DOM', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    document.body.removeChild(btn);

    expect(() => restoreFocus(btn)).not.toThrow();
  });
});
