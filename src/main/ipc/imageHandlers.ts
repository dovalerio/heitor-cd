import { ipcMain } from 'electron';
import type Docker from 'dockerode';
import { IPC } from '../../types/ipc';
import type { IpcResponse } from '../../types/ipc';
import type { ImageInfo } from '../../types/docker';

export function registerImageHandlers(docker: Docker): void {
  // List images
  ipcMain.handle(IPC.IMAGE_LIST, async (): Promise<IpcResponse<ImageInfo[]>> => {
    try {
      const images = await docker.listImages({ all: false });
      const data: ImageInfo[] = images.map((img) => ({
        Id: img.Id,
        RepoTags: img.RepoTags ?? [],
        RepoDigests: img.RepoDigests ?? [],
        Created: img.Created,
        Size: img.Size,
        VirtualSize: img.VirtualSize ?? img.Size,
        Labels: img.Labels ?? null,
      }));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Remove an image
  ipcMain.handle(
    IPC.IMAGE_REMOVE,
    async (_event, { id, force }: { id: string; force: boolean }): Promise<IpcResponse<void>> => {
      try {
        const image = docker.getImage(id);
        await image.remove({ force });
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Pull an image (stream progress, resolves when complete)
  ipcMain.handle(
    IPC.IMAGE_PULL,
    async (_event, { name }: { name: string }): Promise<IpcResponse<void>> => {
      try {
        await new Promise<void>((resolve, reject) => {
          docker.pull(name, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) {
              reject(err);
              return;
            }
            docker.modem.followProgress(stream, (followErr: Error | null) => {
              if (followErr) reject(followErr);
              else resolve();
            });
          });
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
