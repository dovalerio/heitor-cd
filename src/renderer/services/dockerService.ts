/**
 * dockerService.ts - Typed wrappers around window.electronAPI for Docker IPC calls
 */

import { IPC } from '../../types/ipc';
import type { IpcResponse } from '../../types/ipc';
import type {
  ContainerInfo,
  ImageInfo,
  NetworkInfo,
  LogLine,
  ComposeService,
  StackInfo,
} from '../../types/docker';

// ---------------------------------------------------------------------------
// Type-safe invoke helper
// ---------------------------------------------------------------------------

/**
 * Invokes an IPC channel and unwraps the IpcResponse envelope.
 * Throws an Error with the server-provided message when success is false.
 */
async function invoke<T>(channel: string, args?: unknown): Promise<T> {
  // Verificação de segurança: garante que electronAPI foi exposto pelo preload
  const electronAPI = (
    window as unknown as {
      electronAPI?: { invoke: (channel: string, args?: unknown) => Promise<IpcResponse<T>> };
    }
  ).electronAPI;

  if (!electronAPI || typeof electronAPI.invoke !== 'function') {
    throw new Error(
      'electronAPI não está disponível. Certifique-se de que o preload script foi carregado corretamente. ' +
        'Verifique se contextIsolation está habilitado e o preload path está correto.',
    );
  }

  const response: IpcResponse<T> = await electronAPI.invoke(channel, args);

  if (!response.success) {
    throw new Error(response.error ?? `IPC call failed: ${channel}`);
  }

  return response.data as T;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const dockerService = {
  // -------------------------------------------------------------------------
  // Containers
  // -------------------------------------------------------------------------

  /** Returns all (or only running) containers. */
  listContainers(all: boolean = false): Promise<ContainerInfo[]> {
    return invoke<ContainerInfo[]>(IPC.CONTAINER_LIST, { all });
  },

  /** Starts a stopped container. */
  startContainer(id: string): Promise<void> {
    return invoke<void>(IPC.CONTAINER_START, { id });
  },

  /** Stops a running container. */
  stopContainer(id: string): Promise<void> {
    return invoke<void>(IPC.CONTAINER_STOP, { id });
  },

  /** Removes a container. Pass force=true to remove a running container. */
  removeContainer(id: string, force: boolean = false): Promise<void> {
    return invoke<void>(IPC.CONTAINER_REMOVE, { id, force });
  },

  /** Returns detailed information about a single container. */
  inspectContainer(id: string): Promise<ContainerInfo> {
    return invoke<ContainerInfo>(IPC.CONTAINER_INSPECT, { id });
  },

  /**
   * Fetches the log lines for a container.
   * @param tail  Number of lines from the end to return (default: all).
   * @param stderr Include stderr stream (default: true).
   */
  getContainerLogs(id: string, tail?: number, stderr: boolean = true): Promise<LogLine[]> {
    return invoke<LogLine[]>(IPC.CONTAINER_LOGS, { id, tail, stderr });
  },

  // -------------------------------------------------------------------------
  // Images
  // -------------------------------------------------------------------------

  /** Returns all locally available images. */
  listImages(): Promise<ImageInfo[]> {
    return invoke<ImageInfo[]>(IPC.IMAGE_LIST);
  },

  /** Removes a local image. Pass force=true to force removal. */
  removeImage(id: string, force: boolean = false): Promise<void> {
    return invoke<void>(IPC.IMAGE_REMOVE, { id, force });
  },

  /** Pulls an image from a registry (e.g. "nginx:latest"). */
  pullImage(name: string): Promise<void> {
    return invoke<void>(IPC.IMAGE_PULL, { name });
  },

  // -------------------------------------------------------------------------
  // Networks
  // -------------------------------------------------------------------------

  /** Returns all Docker networks. */
  listNetworks(): Promise<NetworkInfo[]> {
    return invoke<NetworkInfo[]>(IPC.NETWORK_LIST);
  },

  /** Creates a new Docker network. */
  createNetwork(name: string, driver: string = 'bridge'): Promise<{ id: string }> {
    return invoke<{ id: string }>(IPC.NETWORK_CREATE, { name, driver });
  },

  /** Removes a Docker network by ID. */
  removeNetwork(id: string): Promise<void> {
    return invoke<void>(IPC.NETWORK_REMOVE, { id });
  },

  // -------------------------------------------------------------------------
  // Compose
  // -------------------------------------------------------------------------

  /** Parses a Docker Compose YAML string into a list of ComposeService objects. */
  parseCompose(yaml: string): Promise<ComposeService[]> {
    return invoke<ComposeService[]>(IPC.COMPOSE_PARSE, { yaml });
  },

  /** Serialises a list of ComposeService objects back to a YAML string. */
  exportCompose(services: ComposeService[]): Promise<string> {
    return invoke<string>(IPC.COMPOSE_EXPORT, { services });
  },

  /** Returns all detected Compose stacks. */
  listStacks(): Promise<StackInfo[]> {
    return invoke<StackInfo[]>(IPC.COMPOSE_STACKS);
  },

  /** Runs `docker compose up` for the given Compose file path. */
  composeUp(yamlPath: string): Promise<void> {
    return invoke<void>(IPC.COMPOSE_UP, { yamlPath });
  },

  /** Runs `docker compose down` for the given Compose file path. */
  composeDown(yamlPath: string): Promise<void> {
    return invoke<void>(IPC.COMPOSE_DOWN, { yamlPath });
  },
};
