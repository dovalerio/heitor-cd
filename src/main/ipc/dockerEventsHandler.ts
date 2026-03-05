import { ipcMain, BrowserWindow } from 'electron';
import Docker from 'dockerode';
import { IPC } from '../../types/ipc';
import type { DockerEvent } from '../../types/docker';

export function registerDockerEventsHandler(docker: Docker, mainWindow: BrowserWindow): void {
  // Holds the active event stream so it can be destroyed on stop.
  let activeStream: NodeJS.ReadableStream | null = null;

  ipcMain.handle(IPC.DOCKER_EVENTS_START, async (): Promise<void> => {
    // If a stream is already running, do nothing.
    if (activeStream) return;

    try {
      const stream = await docker.getEvents({}) as NodeJS.ReadableStream;
      activeStream = stream;

      stream.on('data', (chunk: Buffer) => {
        try {
          const event = JSON.parse(chunk.toString('utf8')) as DockerEvent;
          if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IPC.DOCKER_EVENT, event);
          }
        } catch {
          // Ignore malformed event chunks.
        }
      });

      stream.on('error', () => {
        activeStream = null;
      });

      stream.on('end', () => {
        activeStream = null;
      });
    } catch {
      activeStream = null;
    }
  });

  ipcMain.handle(IPC.DOCKER_EVENTS_STOP, async (): Promise<void> => {
    if (activeStream) {
      try {
        (activeStream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
      } catch {
        // Ignore errors when destroying the stream.
      }
      activeStream = null;
    }
  });
}
