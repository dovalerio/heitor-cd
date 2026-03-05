/**
 * keymapsService.ts - IPC wrappers for keymap persistence and file operations
 */

import { IPC } from '../../types/ipc';
import type { IpcResponse } from '../../types/ipc';
import type { KeymapFile, ParsedShortcut } from '../../types/keymap';
import { parseShortcut } from '@/utils/keyboard';

// ---------------------------------------------------------------------------
// Internal invoke helper (mirrors the one in dockerService)
// ---------------------------------------------------------------------------

async function invoke<T>(channel: string, args?: unknown): Promise<T> {
  const response: IpcResponse<T> = await (
    window as unknown as {
      electronAPI: {
        invoke: (channel: string, args?: unknown) => Promise<IpcResponse<T>>;
      };
    }
  ).electronAPI.invoke(channel, args);

  if (!response.success) {
    throw new Error(response.error ?? `IPC call failed: ${channel}`);
  }

  return response.data as T;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const keymapsService = {
  /**
   * Loads the keymap file from disk via the main process.
   * Returns the full KeymapFile including version, description, and shortcuts.
   */
  load(): Promise<KeymapFile> {
    return invoke<KeymapFile>(IPC.KEYMAPS_LOAD);
  },

  /**
   * Persists a map of actionId -> shortcut string to disk.
   */
  save(shortcuts: Record<string, string>): Promise<void> {
    return invoke<void>(IPC.KEYMAPS_SAVE, { shortcuts });
  },

  /**
   * Asks the main process to open the keymap JSON file in the default editor.
   */
  openFile(): Promise<void> {
    return invoke<void>(IPC.KEYMAPS_OPEN_FILE);
  },

  /**
   * Parses a shortcut string into a ParsedShortcut.
   * Delegates to the keyboard utility so consumers can use this service
   * as their single import point for shortcut-related operations.
   */
  parseShortcut(str: string): ParsedShortcut {
    return parseShortcut(str);
  },
};
