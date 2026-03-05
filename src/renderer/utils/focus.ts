/**
 * focus.ts - Focus management utilities for accessibility (WCAG 2.2 AA)
 */

/** CSS selector that matches all natively focusable elements. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
  'audio[controls]',
  'video[controls]',
].join(', ');

/**
 * getFocusableElements
 *
 * Returns all focusable elements that are currently visible and reachable
 * by keyboard inside the given container.
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );

  // Filter out elements that are hidden via CSS or have a negative tabIndex
  // that was dynamically set (beyond the selector above).
  return candidates.filter(el => {
    if (el.tabIndex < 0) return false;
    // offsetParent is null when display:none or visibility:hidden (roughly)
    // Use getComputedStyle as a more reliable check.
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  });
};

/**
 * trapFocus
 *
 * Intercepts Tab and Shift+Tab to keep focus cycling within `container`.
 * Returns a cleanup function that removes the listener.
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      // Shift+Tab: wrap backward
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap forward
      if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * moveFocusToFirst
 *
 * Moves focus to the first focusable element inside `container`.
 */
export const moveFocusToFirst = (container: HTMLElement): void => {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
  }
};

/**
 * moveFocusToLast
 *
 * Moves focus to the last focusable element inside `container`.
 */
export const moveFocusToLast = (container: HTMLElement): void => {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[focusable.length - 1].focus();
  }
};

/**
 * restoreFocus
 *
 * Restores focus to `previousElement` if it is still attached to the DOM.
 * Silently does nothing when the element is null or no longer present.
 */
export const restoreFocus = (previousElement: HTMLElement | null): void => {
  if (previousElement && document.body.contains(previousElement)) {
    previousElement.focus();
  }
};
