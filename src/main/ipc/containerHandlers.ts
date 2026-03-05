import { ipcMain } from 'electron';
import type Docker from 'dockerode';
import { IPC } from '../../types/ipc';
import type { IpcResponse } from '../../types/ipc';
import type { ContainerInfo, LogLine } from '../../types/docker';

function parseLogsToLines(raw: string, containerId: string, containerName: string): LogLine[] {
  const lines: LogLine[] = [];

  // Docker multiplexed stream: each frame has an 8-byte header.
  // However when logs are returned as a plain string (non-TTY), the header bytes
  // may already be stripped by Dockerode depending on the stream type.
  // We split on newlines and parse timestamps from the beginning of each line.
  const rawLines = raw.split('\n');

  for (const line of rawLines) {
    if (!line.trim()) continue;

    // Attempt to strip the 8-byte binary header that Dockerode may leave in place.
    // The first byte is the stream type: 1 = stdout, 2 = stderr.
    let stream: 'stdout' | 'stderr' = 'stdout';
    let content = line;

    // If the line starts with a non-printable byte (stream type byte), strip the header.
    const firstCharCode = line.charCodeAt(0);
    if (firstCharCode === 1 || firstCharCode === 2) {
      stream = firstCharCode === 2 ? 'stderr' : 'stdout';
      // Skip the 8-byte header (stream type + 3 padding + 4-byte size)
      content = line.slice(8);
    }

    // Try to parse a RFC3339 timestamp at the start of the content.
    const timestampMatch = content.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+/);
    let timestamp = new Date().toISOString();
    let message = content;

    if (timestampMatch) {
      timestamp = timestampMatch[1];
      message = content.slice(timestampMatch[0].length);
    }

    lines.push({
      containerId,
      containerName,
      stream,
      timestamp,
      message,
    });
  }

  return lines;
}

export function registerContainerHandlers(docker: Docker): void {
  // List containers
  ipcMain.handle(
    IPC.CONTAINER_LIST,
    async (_event, { all }: { all: boolean }): Promise<IpcResponse<ContainerInfo[]>> => {
      try {
        const containers = await docker.listContainers({ all });
        const data: ContainerInfo[] = containers.map((c) => ({
          Id: c.Id,
          Names: c.Names,
          Image: c.Image,
          ImageID: c.ImageID,
          Command: c.Command,
          Created: c.Created,
          Status: c.Status,
          State: c.State as ContainerInfo['State'],
          Ports: c.Ports,
          Labels: c.Labels ?? {},
          NetworkSettings: c.NetworkSettings as ContainerInfo['NetworkSettings'],
        }));
        return { success: true, data };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Start a container
  ipcMain.handle(
    IPC.CONTAINER_START,
    async (_event, { id }: { id: string }): Promise<IpcResponse<void>> => {
      try {
        const container = docker.getContainer(id);
        await container.start();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Stop a container
  ipcMain.handle(
    IPC.CONTAINER_STOP,
    async (_event, { id }: { id: string }): Promise<IpcResponse<void>> => {
      try {
        const container = docker.getContainer(id);
        await container.stop();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Remove a container
  ipcMain.handle(
    IPC.CONTAINER_REMOVE,
    async (_event, { id, force }: { id: string; force: boolean }): Promise<IpcResponse<void>> => {
      try {
        const container = docker.getContainer(id);
        await container.remove({ force });
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Inspect a container
  ipcMain.handle(
    IPC.CONTAINER_INSPECT,
    async (_event, { id }: { id: string }): Promise<IpcResponse<ContainerInfo>> => {
      try {
        const container = docker.getContainer(id);
        const info = await container.inspect();
        const data: ContainerInfo = {
          Id: info.Id,
          Names: [info.Name],
          Image: info.Config?.Image ?? '',
          ImageID: info.Image,
          Command: Array.isArray(info.Config?.Cmd)
            ? info.Config.Cmd.join(' ')
            : (info.Config?.Cmd ?? ''),
          Created: new Date(info.Created).getTime() / 1000,
          Status: info.State?.Status ?? '',
          State: (info.State?.Status ?? 'created') as ContainerInfo['State'],
          Ports: Object.entries(info.NetworkSettings?.Ports ?? {}).flatMap(([key, bindings]) => {
            const [privatePortStr, type] = key.split('/');
            const privatePort = parseInt(privatePortStr, 10);
            if (!bindings) return [{ PrivatePort: privatePort, Type: type }];
            return (bindings as Array<{ HostIp: string; HostPort: string }>).map((b) => ({
              IP: b.HostIp,
              PrivatePort: privatePort,
              PublicPort: parseInt(b.HostPort, 10),
              Type: type,
            }));
          }),
          Labels: info.Config?.Labels ?? {},
          NetworkSettings: {
            Networks: Object.fromEntries(
              Object.entries(info.NetworkSettings?.Networks ?? {}).map(([name, net]) => [
                name,
                { IPAddress: (net as { IPAddress: string }).IPAddress },
              ]),
            ),
          },
        };
        return { success: true, data };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Fetch container logs
  ipcMain.handle(
    IPC.CONTAINER_LOGS,
    async (
      _event,
      { id, tail, stderr }: { id: string; tail: number; stderr: boolean },
    ): Promise<IpcResponse<LogLine[]>> => {
      try {
        const container = docker.getContainer(id);

        // Retrieve container name for LogLine population
        const inspected = await container.inspect();
        const containerName = inspected.Name.replace(/^\//, '');

        const logsBuffer = await container.logs({
          stdout: true,
          stderr,
          tail,
          timestamps: true,
        });

        const raw = logsBuffer.toString('utf8');
        const lines = parseLogsToLines(raw, id, containerName);
        return { success: true, data: lines };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
