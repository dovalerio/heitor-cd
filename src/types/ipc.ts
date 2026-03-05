import type { ContainerInfo, ImageInfo, NetworkInfo, LogLine, DockerEvent, ComposeService, StackInfo } from './docker';

// IPC channel names
export const IPC = {
  // Containers
  CONTAINER_LIST: 'container:list',
  CONTAINER_START: 'container:start',
  CONTAINER_STOP: 'container:stop',
  CONTAINER_REMOVE: 'container:remove',
  CONTAINER_INSPECT: 'container:inspect',
  CONTAINER_LOGS: 'container:logs',

  // Images
  IMAGE_LIST: 'image:list',
  IMAGE_REMOVE: 'image:remove',
  IMAGE_PULL: 'image:pull',

  // Networks
  NETWORK_LIST: 'network:list',
  NETWORK_CREATE: 'network:create',
  NETWORK_REMOVE: 'network:remove',

  // Compose
  COMPOSE_UP: 'compose:up',
  COMPOSE_DOWN: 'compose:down',
  COMPOSE_PARSE: 'compose:parse',
  COMPOSE_EXPORT: 'compose:export',
  COMPOSE_STACKS: 'compose:stacks',

  // Docker events
  DOCKER_EVENTS_START: 'docker:events:start',
  DOCKER_EVENTS_STOP: 'docker:events:stop',
  DOCKER_EVENT: 'docker:event',

  // Keymaps
  KEYMAPS_LOAD: 'keymaps:load',
  KEYMAPS_SAVE: 'keymaps:save',
  KEYMAPS_OPEN_FILE: 'keymaps:openFile',

  // App
  APP_READY: 'app:ready',
} as const;

export type IpcChannel = typeof IPC[keyof typeof IPC];

// Response wrapper
export interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Typed IPC response helpers
export type ContainerListResponse = IpcResponse<ContainerInfo[]>;
export type ImageListResponse = IpcResponse<ImageInfo[]>;
export type NetworkListResponse = IpcResponse<NetworkInfo[]>;
export type LogsResponse = IpcResponse<LogLine[]>;
export type StackListResponse = IpcResponse<StackInfo[]>;
export type ComposeExportResponse = IpcResponse<string>;
export type ComposeParseResponse = IpcResponse<ComposeService[]>;
