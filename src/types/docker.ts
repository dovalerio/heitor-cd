// Shared Docker types used by both main and renderer processes

export type ContainerStatus =
  | 'created'
  | 'restarting'
  | 'running'
  | 'removing'
  | 'paused'
  | 'exited'
  | 'dead';

export interface ContainerPort {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

export interface ContainerInfo {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Status: string;
  State: ContainerStatus;
  Ports: ContainerPort[];
  Labels: Record<string, string>;
  NetworkSettings?: {
    Networks: Record<string, { IPAddress: string }>;
  };
}

export interface ImageInfo {
  Id: string;
  RepoTags: string[];
  RepoDigests: string[];
  Created: number;
  Size: number;
  VirtualSize: number;
  Labels: Record<string, string> | null;
}

export interface NetworkInfo {
  Id: string;
  Name: string;
  Driver: string;
  Scope: string;
  Internal: boolean;
  Containers: Record<string, NetworkContainer>;
  Created: string;
  IPAM: {
    Driver: string;
    Config: Array<{ Subnet?: string; Gateway?: string }>;
  };
}

export interface NetworkContainer {
  Name: string;
  EndpointID: string;
  MacAddress: string;
  IPv4Address: string;
  IPv6Address: string;
}

export type DockerEventType =
  | 'container'
  | 'image'
  | 'network'
  | 'volume'
  | 'plugin'
  | 'daemon';

export type DockerEventAction =
  | 'create'
  | 'start'
  | 'stop'
  | 'kill'
  | 'die'
  | 'pause'
  | 'unpause'
  | 'restart'
  | 'destroy'
  | 'rename'
  | 'update'
  | 'pull'
  | 'push'
  | 'delete'
  | 'connect'
  | 'disconnect';

export interface DockerEvent {
  Type: DockerEventType;
  Action: DockerEventAction;
  Actor: {
    ID: string;
    Attributes: Record<string, string>;
  };
  time: number;
  timeNano: number;
}

// Compose types
export interface ComposeService {
  id: string;
  name: string;
  image: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  depends_on: string[];
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  command?: string;
}

export interface ComposeFile {
  version: string;
  services: Record<string, Omit<ComposeService, 'id' | 'name'>>;
  networks?: Record<string, { driver?: string }>;
  volumes?: Record<string, { driver?: string }>;
}

export interface StackInfo {
  name: string;
  services: string[];
  status: 'running' | 'partial' | 'stopped';
  configFile?: string;
}

export interface LogLine {
  containerId: string;
  containerName: string;
  stream: 'stdout' | 'stderr';
  timestamp: string;
  message: string;
}
