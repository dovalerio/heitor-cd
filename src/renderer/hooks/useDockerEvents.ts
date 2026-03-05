/**
 * useDockerEvents - Hook that manages the Docker event stream lifecycle
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { IPC } from '../../types/ipc';
import type { DockerEvent } from '../../types/docker';

// ---------------------------------------------------------------------------
// Window type augmentation
// ---------------------------------------------------------------------------

interface ElectronAPI {
  invoke: (channel: string, args?: unknown) => Promise<unknown>;
  on: (channel: string, cb: (...args: unknown[]) => void) => void;
  off: (channel: string, cb: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useDockerEvents = (
  onEvent: (event: DockerEvent) => void,
  enabled: boolean = true
) => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Keep stable refs so effects don't re-run on every render
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // The raw listener that bridges the IPC channel to the caller's callback.
  // It must remain the same reference across renders so we can unregister it.
  const ipcListenerRef = useRef<(...args: unknown[]) => void>();

  // Start monitoring: send IPC request + register listener
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;

    try {
      await window.electronAPI.invoke(IPC.DOCKER_EVENTS_START);

      const listener = (...args: unknown[]) => {
        // The main process emits the DockerEvent as the first extra argument
        const event = args[0] as DockerEvent;
        onEventRef.current(event);
      };

      ipcListenerRef.current = listener;
      window.electronAPI.on(IPC.DOCKER_EVENT, listener);
      setIsMonitoring(true);
    } catch (err) {
      console.error('[useDockerEvents] Failed to start monitoring:', err);
    }
  }, [isMonitoring]);

  // Stop monitoring: send IPC request + remove listener
  const stopMonitoring = useCallback(async () => {
    if (!isMonitoring) return;

    try {
      await window.electronAPI.invoke(IPC.DOCKER_EVENTS_STOP);
    } catch (err) {
      console.warn('[useDockerEvents] Failed to stop monitoring cleanly:', err);
    }

    if (ipcListenerRef.current) {
      window.electronAPI.off(IPC.DOCKER_EVENT, ipcListenerRef.current);
      ipcListenerRef.current = undefined;
    }

    setIsMonitoring(false);
  }, [isMonitoring]);

  // Toggle between started/stopped states
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      void stopMonitoring();
    } else {
      void startMonitoring();
    }
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  // Auto-start when enabled=true, auto-stop when enabled=false
  useEffect(() => {
    if (enabled) {
      void startMonitoring();
    } else {
      void stopMonitoring();
    }

    // On unmount always clean up regardless of enabled state
    return () => {
      // Use a fire-and-forget cleanup (we can't await inside cleanup)
      if (ipcListenerRef.current) {
        window.electronAPI.off(IPC.DOCKER_EVENT, ipcListenerRef.current);
        ipcListenerRef.current = undefined;
      }
      void window.electronAPI.invoke(IPC.DOCKER_EVENTS_STOP).catch(() => {
        // Ignore errors during unmount cleanup
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { isMonitoring, toggleMonitoring };
};
