import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../types/ipc';

console.log('[preload] Preload script iniciando...');
console.log('[preload] IPC channels disponíveis:', Object.keys(IPC).length);

// Build the allowlist of valid IPC channels from the IPC constants object.
const ALLOWED_CHANNELS = new Set<string>(Object.values(IPC));

interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
}

const electronAPI: ElectronAPI = {
  invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: "${channel}"`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  on(channel: string, callback: (...args: unknown[]) => void): void {
    if (!ALLOWED_CHANNELS.has(channel)) {
      console.warn(`[preload] Attempted to subscribe to non-allowed channel: "${channel}"`);
      return;
    }
    // Wrap to extract the event payload (drop the Electron Event object).
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },

  off(channel: string, callback: (...args: unknown[]) => void): void {
    if (!ALLOWED_CHANNELS.has(channel)) {
      console.warn(`[preload] Attempted to unsubscribe from non-allowed channel: "${channel}"`);
      return;
    }
    ipcRenderer.removeListener(channel, callback);
  },
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('[preload] ✓ electronAPI exposto com sucesso no window');
} catch (error) {
  console.error('[preload] ✗ Erro ao expor electronAPI:', error);
}
