/**
 * useFocusManagement - Hook that exposes focus-trap and focus-movement helpers
 * for a given container ref.
 */

import { useCallback, useRef, type RefObject } from 'react';
import {
  trapFocus,
  moveFocusToFirst,
  moveFocusToLast,
} from '@/utils/focus';

export const useFocusManagement = (containerRef: RefObject<HTMLElement>) => {
  // Holds the cleanup function returned by trapFocus so we can call it later
  const cleanupRef = useRef<(() => void) | null>(null);

  /**
   * Activates the focus trap inside the container.
   * If a trap is already active it is released first.
   */
  const trapFocusInContainer = useCallback(() => {
    if (!containerRef.current) return;

    // Release any existing trap before installing a new one
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    cleanupRef.current = trapFocus(containerRef.current);
  }, [containerRef]);

  /**
   * Releases the currently active focus trap (if any).
   */
  const releaseTrap = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  /**
   * Moves focus to the first focusable element inside the container.
   */
  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      moveFocusToFirst(containerRef.current);
    }
  }, [containerRef]);

  /**
   * Moves focus to the last focusable element inside the container.
   */
  const focusLast = useCallback(() => {
    if (containerRef.current) {
      moveFocusToLast(containerRef.current);
    }
  }, [containerRef]);

  return {
    trapFocus: trapFocusInContainer,
    releaseTrap,
    focusFirst,
    focusLast,
  };
};
