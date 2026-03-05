/**
 * useKeyboardNav.ts - Hooks for loading keymaps and binding keyboard actions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActionId, ParsedShortcut } from '../../types/keymap';
import { keymapsService } from '@/services/keymapsService';
import { matchesShortcut } from '@/utils/keyboard';

// ---------------------------------------------------------------------------
// useKeymaps
// ---------------------------------------------------------------------------

/**
 * Loads the keymap configuration once on mount and exposes the parsed
 * shortcuts as a lookup map keyed by ActionId.
 */
export const useKeymaps = () => {
  const [shortcuts, setShortcuts] = useState<Partial<Record<ActionId, ParsedShortcut>>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    keymapsService
      .load()
      .then((keymapFile) => {
        if (cancelled) return;

        const parsed: Partial<Record<ActionId, ParsedShortcut>> = {};

        for (const [actionId, shortcutStr] of Object.entries(keymapFile.shortcuts)) {
          try {
            parsed[actionId as ActionId] = keymapsService.parseShortcut(shortcutStr);
          } catch {
            // Ignore malformed entries so the rest still work
            console.warn(
              `[useKeymaps] Could not parse shortcut for "${actionId}": "${shortcutStr}"`,
            );
          }
        }

        setShortcuts(parsed);
        setIsLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[useKeymaps] Failed to load keymaps:', err);
        // Still mark as loaded so consumers don't wait forever
        setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    shortcuts: shortcuts as Record<ActionId, ParsedShortcut>,
    isLoaded,
  };
};

// ---------------------------------------------------------------------------
// useKeyboardAction
// ---------------------------------------------------------------------------

/**
 * Registers a global keydown listener that fires `handler` when the
 * keymapped shortcut for `actionId` is pressed.
 *
 * The shortcut is resolved via `keymapsService.load()` once per mount.
 * If `enabled` is false the listener is not active.
 */
export const useKeyboardAction = (
  actionId: ActionId,
  handler: () => void,
  enabled: boolean = true,
): void => {
  // Keep a stable ref to handler so the keydown listener doesn't need to be
  // re-registered whenever the caller's handler changes identity.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const shortcutRef = useRef<ParsedShortcut | null>(null);
  const loadedRef = useRef(false);

  // Load the shortcut for this action once
  useEffect(() => {
    let cancelled = false;

    keymapsService
      .load()
      .then((keymapFile) => {
        if (cancelled) return;
        const str = keymapFile.shortcuts[actionId];
        if (str) {
          try {
            shortcutRef.current = keymapsService.parseShortcut(str);
          } catch {
            console.warn(`[useKeyboardAction] Invalid shortcut for "${actionId}": "${str}"`);
          }
        }
        loadedRef.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[useKeyboardAction] Failed to load keymaps:', err);
        loadedRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [actionId]);

  const stableEnabled = useRef(enabled);
  useEffect(() => {
    stableEnabled.current = enabled;
  }, [enabled]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!stableEnabled.current) return;
    if (!shortcutRef.current) return;

    if (matchesShortcut(event, shortcutRef.current)) {
      event.preventDefault();
      handlerRef.current();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};
