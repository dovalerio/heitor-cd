import { ipcMain, shell, app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IPC } from '../../types/ipc';
import type { IpcResponse } from '../../types/ipc';
import type { KeymapFile } from '../../types/keymap';

/**
 * Resolves the path to the `.keymaps` file, located in the app root directory.
 * In development the app root is the repo root; in production it's the resources directory.
 */
function getKeymapsPath(): string {
  const appRoot = app.isPackaged
    ? path.join(process.resourcesPath)
    : path.join(app.getAppPath());
  return path.join(appRoot, '.keymaps');
}

export function registerKeymapsHandlers(): void {
  // Load the .keymaps file
  ipcMain.handle(IPC.KEYMAPS_LOAD, async (): Promise<IpcResponse<KeymapFile>> => {
    try {
      const keymapsPath = getKeymapsPath();
      const raw = await fs.readFile(keymapsPath, 'utf8');
      const data: KeymapFile = JSON.parse(raw);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Save shortcuts back to the .keymaps file
  ipcMain.handle(
    IPC.KEYMAPS_SAVE,
    async (
      _event,
      { shortcuts }: { shortcuts: Record<string, string> }
    ): Promise<IpcResponse<void>> => {
      try {
        const keymapsPath = getKeymapsPath();

        // Read existing file so we preserve version and description fields.
        let existing: KeymapFile = { version: 1, description: '', shortcuts: {} };
        try {
          const raw = await fs.readFile(keymapsPath, 'utf8');
          existing = JSON.parse(raw) as KeymapFile;
        } catch {
          // File may not exist yet; use defaults.
        }

        const updated: KeymapFile = {
          ...existing,
          shortcuts: shortcuts as KeymapFile['shortcuts'],
        };

        await fs.writeFile(keymapsPath, JSON.stringify(updated, null, 2), 'utf8');
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  // Open the .keymaps file in the default editor
  ipcMain.handle(IPC.KEYMAPS_OPEN_FILE, async (): Promise<IpcResponse<void>> => {
    try {
      const keymapsPath = getKeymapsPath();
      const errorMsg = await shell.openPath(keymapsPath);
      if (errorMsg) {
        return { success: false, error: errorMsg };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
