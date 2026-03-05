import { ipcMain } from 'electron';
import type Docker from 'dockerode';
import { IPC } from '../../types/ipc';
import type { IpcResponse } from '../../types/ipc';
import type { NetworkInfo } from '../../types/docker';

export function registerNetworkHandlers(docker: Docker): void {
  // List networks
  ipcMain.handle(IPC.NETWORK_LIST, async (): Promise<IpcResponse<NetworkInfo[]>> => {
    try {
      const networks = await docker.listNetworks();
      const data: NetworkInfo[] = networks.map((net) => ({
        Id: net.Id,
        Name: net.Name,
        Driver: net.Driver,
        Scope: net.Scope,
        Internal: net.Internal ?? false,
        Containers: (net.Containers as NetworkInfo['Containers']) ?? {},
        Created: net.Created,
        IPAM: {
          Driver: net.IPAM?.Driver ?? 'default',
          Config: (net.IPAM?.Config ?? []).map((cfg) => ({
            Subnet: cfg.Subnet,
            Gateway: cfg.Gateway,
          })),
        },
      }));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Create a network
  ipcMain.handle(
    IPC.NETWORK_CREATE,
    async (
      _event,
      { name, driver }: { name: string; driver: string },
    ): Promise<IpcResponse<{ id: string }>> => {
      try {
        const network = await docker.createNetwork({ Name: name, Driver: driver });
        const info = (await network.inspect()) as { Id: string };
        return { success: true, data: { id: info.Id } };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Remove a network
  ipcMain.handle(
    IPC.NETWORK_REMOVE,
    async (_event, { id }: { id: string }): Promise<IpcResponse<void>> => {
      try {
        const network = docker.getNetwork(id);
        await network.remove();
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
