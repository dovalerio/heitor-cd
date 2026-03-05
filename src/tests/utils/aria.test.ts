import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getButtonAriaProps,
  getInputAriaProps,
  getToggleAriaProps,
  getListAriaProps,
  getListItemAriaProps,
  getTreeAriaProps,
  getTreeNodeAriaProps,
  getDialogAriaProps,
  getLiveRegionAriaProps,
  generateId,
  announceToScreenReader,
  setFocusWithAnnouncement,
  createFocusTrap,
} from '../../renderer/utils/aria';

describe('getButtonAriaProps', () => {
  it('returns correct props for a normal enabled button', () => {
    const props = getButtonAriaProps('Click me');
    expect(props.role).toBe('button');
    expect(props['aria-label']).toBe('Click me');
    expect(props['aria-disabled']).toBe(false);
    expect(props.tabIndex).toBe(0);
    expect(props).not.toHaveProperty('aria-pressed');
  });

  it('sets aria-disabled and negative tabIndex when disabled', () => {
    const props = getButtonAriaProps('Submit', true);
    expect(props['aria-disabled']).toBe(true);
    expect(props.tabIndex).toBe(-1);
  });

  it('includes aria-pressed when pressed is true', () => {
    const props = getButtonAriaProps('Toggle', false, true);
    expect(props['aria-pressed']).toBe(true);
  });

  it('includes aria-pressed when pressed is false', () => {
    const props = getButtonAriaProps('Toggle', false, false);
    expect(props['aria-pressed']).toBe(false);
  });

  it('does not include aria-pressed when pressed is undefined', () => {
    const props = getButtonAriaProps('Button');
    expect(props).not.toHaveProperty('aria-pressed');
  });

  it('disabled with pressed: returns tabIndex -1 and aria-pressed', () => {
    const props = getButtonAriaProps('Toggle', true, true);
    expect(props['aria-disabled']).toBe(true);
    expect(props.tabIndex).toBe(-1);
    expect(props['aria-pressed']).toBe(true);
  });
});

describe('getInputAriaProps', () => {
  it('returns basic props without required/invalid/describedBy by default', () => {
    const props = getInputAriaProps('name-input', 'Full Name');
    expect(props.id).toBe('name-input');
    expect(props['aria-label']).toBe('Full Name');
    expect(props['aria-required']).toBe(false);
    expect(props['aria-invalid']).toBe(false);
    expect(props).not.toHaveProperty('aria-describedby');
  });

  it('sets aria-required to true when required', () => {
    const props = getInputAriaProps('email', 'Email', true);
    expect(props['aria-required']).toBe(true);
  });

  it('sets aria-invalid to true when invalid', () => {
    const props = getInputAriaProps('email', 'Email', false, true);
    expect(props['aria-invalid']).toBe(true);
  });

  it('includes aria-describedby when describedBy is provided', () => {
    const props = getInputAriaProps('email', 'Email', false, false, 'email-hint');
    expect(props['aria-describedby']).toBe('email-hint');
  });

  it('does not include aria-describedby when describedBy is undefined', () => {
    const props = getInputAriaProps('email', 'Email', false, false, undefined);
    expect(props).not.toHaveProperty('aria-describedby');
  });
});

describe('getToggleAriaProps', () => {
  it('returns correct props for checked toggle', () => {
    const props = getToggleAriaProps(true, 'Dark Mode');
    expect(props.role).toBe('switch');
    expect(props['aria-checked']).toBe(true);
    expect(props['aria-label']).toBe('Dark Mode');
    expect(props['aria-disabled']).toBe(false);
    expect(props.tabIndex).toBe(0);
  });

  it('returns correct props for unchecked toggle', () => {
    const props = getToggleAriaProps(false, 'Dark Mode');
    expect(props['aria-checked']).toBe(false);
    expect(props.tabIndex).toBe(0);
  });

  it('sets aria-disabled and negative tabIndex when disabled', () => {
    const props = getToggleAriaProps(false, 'Notifications', true);
    expect(props['aria-disabled']).toBe(true);
    expect(props.tabIndex).toBe(-1);
  });

  it('disabled checked toggle has correct props', () => {
    const props = getToggleAriaProps(true, 'Sound', true);
    expect(props['aria-checked']).toBe(true);
    expect(props['aria-disabled']).toBe(true);
    expect(props.tabIndex).toBe(-1);
  });
});

describe('getListAriaProps', () => {
  it('returns vertical orientation by default', () => {
    const props = getListAriaProps(5);
    expect(props.role).toBe('list');
    expect(props['aria-orientation']).toBe('vertical');
    expect(props['aria-label']).toBe('Lista com 5 itens');
  });

  it('returns horizontal orientation when specified', () => {
    const props = getListAriaProps(3, 'horizontal');
    expect(props['aria-orientation']).toBe('horizontal');
    expect(props['aria-label']).toBe('Lista com 3 itens');
  });

  it('includes correct item count in label', () => {
    const props = getListAriaProps(0);
    expect(props['aria-label']).toBe('Lista com 0 itens');
  });
});

describe('getListItemAriaProps', () => {
  it('returns correct aria-posinset (1-based) and aria-setsize', () => {
    const props = getListItemAriaProps(0, 10);
    expect(props.role).toBe('listitem');
    expect(props['aria-posinset']).toBe(1);
    expect(props['aria-setsize']).toBe(10);
  });

  it('returns aria-selected false by default', () => {
    const props = getListItemAriaProps(2, 5);
    expect(props['aria-selected']).toBe(false);
  });

  it('returns aria-selected true when selected', () => {
    const props = getListItemAriaProps(1, 5, true);
    expect(props['aria-selected']).toBe(true);
  });

  it('correctly computes posinset for last item', () => {
    const props = getListItemAriaProps(9, 10);
    expect(props['aria-posinset']).toBe(10);
    expect(props['aria-setsize']).toBe(10);
  });
});

describe('getTreeAriaProps', () => {
  it('returns tree props with multiSelect false by default', () => {
    const props = getTreeAriaProps('File Tree');
    expect(props.role).toBe('tree');
    expect(props['aria-label']).toBe('File Tree');
    expect(props['aria-multiselectable']).toBe(false);
  });

  it('returns multiselectable true when multiSelect is true', () => {
    const props = getTreeAriaProps('Categories', true);
    expect(props['aria-multiselectable']).toBe(true);
  });
});

describe('getTreeNodeAriaProps', () => {
  it('returns correct props for an expanded selected node', () => {
    const props = getTreeNodeAriaProps(true, true, 2, 3, 5, 'Documents');
    expect(props.role).toBe('treeitem');
    expect(props['aria-expanded']).toBe(true);
    expect(props['aria-selected']).toBe(true);
    expect(props['aria-level']).toBe(2);
    expect(props['aria-posinset']).toBe(3);
    expect(props['aria-setsize']).toBe(5);
    expect(props['aria-label']).toBe('Documents');
  });

  it('returns correct props for a collapsed unselected node', () => {
    const props = getTreeNodeAriaProps(false, false, 1, 1, 3, 'Root');
    expect(props['aria-expanded']).toBe(false);
    expect(props['aria-selected']).toBe(false);
    expect(props['aria-level']).toBe(1);
    expect(props['aria-posinset']).toBe(1);
    expect(props['aria-setsize']).toBe(3);
  });
});

describe('getDialogAriaProps', () => {
  it('returns modal dialog by default', () => {
    const props = getDialogAriaProps('Confirm Action');
    expect(props.role).toBe('dialog');
    expect(props['aria-label']).toBe('Confirm Action');
    expect(props['aria-modal']).toBe(true);
    expect(props).not.toHaveProperty('aria-describedby');
  });

  it('returns alertdialog role when modal is false', () => {
    const props = getDialogAriaProps('Alert', undefined, false);
    expect(props.role).toBe('alertdialog');
    expect(props['aria-modal']).toBe(false);
  });

  it('includes aria-describedby when provided', () => {
    const props = getDialogAriaProps('Dialog', 'dialog-desc');
    expect(props['aria-describedby']).toBe('dialog-desc');
  });

  it('does not include aria-describedby when not provided', () => {
    const props = getDialogAriaProps('Dialog');
    expect(props).not.toHaveProperty('aria-describedby');
  });
});

describe('getLiveRegionAriaProps', () => {
  it('returns polite live region with atomic by default', () => {
    const props = getLiveRegionAriaProps();
    expect(props['aria-live']).toBe('polite');
    expect(props['aria-atomic']).toBe(true);
    expect(props.role).toBe('status');
  });

  it('returns assertive when polite is false', () => {
    const props = getLiveRegionAriaProps(false);
    expect(props['aria-live']).toBe('assertive');
  });

  it('returns atomic false when specified', () => {
    const props = getLiveRegionAriaProps(true, false);
    expect(props['aria-atomic']).toBe(false);
  });

  it('returns assertive and non-atomic', () => {
    const props = getLiveRegionAriaProps(false, false);
    expect(props['aria-live']).toBe('assertive');
    expect(props['aria-atomic']).toBe(false);
  });
});

describe('generateId', () => {
  it('starts with the given prefix', () => {
    const id = generateId('btn');
    expect(id).toMatch(/^btn-/);
  });

  it('generates unique IDs on each call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('id')));
    expect(ids.size).toBe(50);
  });

  it('works with different prefixes', () => {
    const id1 = generateId('input');
    const id2 = generateId('label');
    expect(id1).toMatch(/^input-/);
    expect(id2).toMatch(/^label-/);
  });
});

describe('announceToScreenReader', () => {
  beforeEach(() => {
    // Clean up any leftover elements
    document.body.innerHTML = '';
  });

  it('appends a div to document.body with the message', () => {
    announceToScreenReader('Loading complete');
    const region = document.body.querySelector('[aria-live]');
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe('Loading complete');
  });

  it('sets aria-live to polite by default', () => {
    announceToScreenReader('Update');
    const region = document.body.querySelector('[aria-live]');
    expect(region?.getAttribute('aria-live')).toBe('polite');
  });

  it('sets aria-live to assertive when assertive flag is true', () => {
    announceToScreenReader('Error occurred', true);
    const region = document.body.querySelector('[aria-live]');
    expect(region?.getAttribute('aria-live')).toBe('assertive');
  });

  it('sets role to status', () => {
    announceToScreenReader('Done');
    const region = document.body.querySelector('[role="status"]');
    expect(region).not.toBeNull();
  });

  it('removes the element from DOM after the duration', async () => {
    vi.useFakeTimers();
    announceToScreenReader('Temporary message', false, 500);
    expect(document.body.querySelector('[aria-live]')).not.toBeNull();
    vi.advanceTimersByTime(500);
    expect(document.body.querySelector('[aria-live]')).toBeNull();
    vi.useRealTimers();
  });
});

describe('setFocusWithAnnouncement', () => {
  it('calls focus on the element', () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    const focusSpy = vi.spyOn(el, 'focus');
    setFocusWithAnnouncement(el);
    expect(focusSpy).toHaveBeenCalledOnce();
    document.body.removeChild(el);
  });

  it('does nothing when element is null', () => {
    // Should not throw
    expect(() => setFocusWithAnnouncement(null)).not.toThrow();
  });

  it('announces message to screen reader when announcement is provided', () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    setFocusWithAnnouncement(el, 'Button focused');
    const region = document.body.querySelector('[aria-live]');
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe('Button focused');
    document.body.removeChild(el);
  });

  it('does not announce when no announcement string is given', () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    // Remove any existing live regions first
    document.querySelectorAll('[aria-live]').forEach((n) => n.remove());
    setFocusWithAnnouncement(el);
    const region = document.body.querySelector('[aria-live]');
    expect(region).toBeNull();
    document.body.removeChild(el);
  });
});

describe('createFocusTrap', () => {
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

  it('returns a cleanup function even when container has no focusable elements', () => {
    const cleanup = createFocusTrap(container);
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });

  it('Tab on last element wraps focus to first element', () => {
    const [first, , last] = addButtons(3);

    createFocusTrap(container);

    // Simulate focus on last element
    last.focus();

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: false,
      bubbles: true,
    });
    const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

    container.dispatchEvent(tabEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
  });

  it('Shift+Tab on first element wraps focus to last element', () => {
    const [first, , last] = addButtons(3);

    createFocusTrap(container);

    first.focus();

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');

    container.dispatchEvent(shiftTabEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);
  });

  it('non-Tab keydown does not affect focus', () => {
    const [first] = addButtons(2);
    createFocusTrap(container);
    first.focus();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    container.dispatchEvent(enterEvent);

    expect(document.activeElement).toBe(first);
  });

  it('cleanup removes the keydown listener', () => {
    const [, , last] = addButtons(3);
    const cleanup = createFocusTrap(container);

    cleanup();

    last.focus();
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: false,
      bubbles: true,
    });
    container.dispatchEvent(tabEvent);

    // After cleanup, focus should NOT have wrapped to first
    expect(document.activeElement).toBe(last);
  });
});
