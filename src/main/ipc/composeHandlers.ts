import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import * as yaml from 'js-yaml';
import type Docker from 'dockerode';
import { IPC } from '../../types/ipc';
import type { IpcResponse } from '../../types/ipc';
import type { ComposeService, StackInfo } from '../../types/docker';

// Shape of a service entry inside a docker-compose YAML document
interface RawComposeService {
  image?: string;
  ports?: string[];
  environment?: Record<string, string> | string[];
  volumes?: string[];
  networks?: string[];
  depends_on?: string[] | Record<string, unknown>;
  restart?: ComposeService['restart'];
  command?: string | string[];
}

interface RawComposeFile {
  version?: string;
  services?: Record<string, RawComposeService>;
}

function parseEnvironment(
  env: Record<string, string> | string[] | undefined,
): Record<string, string> {
  if (!env) return {};
  if (Array.isArray(env)) {
    return Object.fromEntries(
      env.map((entry) => {
        const idx = entry.indexOf('=');
        if (idx === -1) return [entry, ''];
        return [entry.slice(0, idx), entry.slice(idx + 1)];
      }),
    );
  }
  return env;
}

function parseDependsOn(dependsOn: string[] | Record<string, unknown> | undefined): string[] {
  if (!dependsOn) return [];
  if (Array.isArray(dependsOn)) return dependsOn;
  return Object.keys(dependsOn);
}

function rawServiceToComposeService(name: string, raw: RawComposeService): ComposeService {
  return {
    id: name,
    name,
    image: raw.image ?? '',
    ports: raw.ports ?? [],
    environment: parseEnvironment(raw.environment),
    volumes: raw.volumes ?? [],
    networks: raw.networks ?? [],
    depends_on: parseDependsOn(raw.depends_on),
    restart: raw.restart,
    command: Array.isArray(raw.command) ? raw.command.join(' ') : raw.command,
  };
}

function composeServiceToRaw(service: ComposeService): RawComposeService {
  const raw: RawComposeService = {};
  if (service.image) raw.image = service.image;
  if (service.ports.length) raw.ports = service.ports;
  if (Object.keys(service.environment).length) raw.environment = service.environment;
  if (service.volumes.length) raw.volumes = service.volumes;
  if (service.networks.length) raw.networks = service.networks;
  if (service.depends_on.length) raw.depends_on = service.depends_on;
  if (service.restart) raw.restart = service.restart;
  if (service.command) raw.command = service.command;
  return raw;
}

function spawnCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

export function registerComposeHandlers(docker: Docker): void {
  // Parse a YAML string into a list of ComposeService objects
  ipcMain.handle(
    IPC.COMPOSE_PARSE,
    async (_event, { yaml: yamlStr }: { yaml: string }): Promise<IpcResponse<ComposeService[]>> => {
      try {
        const doc = yaml.load(yamlStr) as RawComposeFile;
        const services = doc?.services ?? {};
        const data: ComposeService[] = Object.entries(services).map(([name, raw]) =>
          rawServiceToComposeService(name, raw),
        );
        return { success: true, data };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Export a list of ComposeService objects to a YAML string
  ipcMain.handle(
    IPC.COMPOSE_EXPORT,
    async (_event, { services }: { services: ComposeService[] }): Promise<IpcResponse<string>> => {
      try {
        const servicesRecord: Record<string, RawComposeService> = {};
        for (const service of services) {
          servicesRecord[service.name] = composeServiceToRaw(service);
        }
        const doc: RawComposeFile = {
          version: '3.8',
          services: servicesRecord,
        };
        const data = yaml.dump(doc, { lineWidth: -1, noRefs: true });
        return { success: true, data };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // List running compose stacks by inspecting the com.docker.compose.project label
  ipcMain.handle(IPC.COMPOSE_STACKS, async (): Promise<IpcResponse<StackInfo[]>> => {
    try {
      const containers = await docker.listContainers({ all: true });

      const stackMap = new Map<
        string,
        { services: Set<string>; runningCount: number; total: number; configFile?: string }
      >();

      for (const container of containers) {
        const projectName = container.Labels?.['com.docker.compose.project'];
        if (!projectName) continue;

        const serviceName = container.Labels?.['com.docker.compose.service'] ?? container.Names[0];
        const configFile = container.Labels?.['com.docker.compose.project.config_files'];

        if (!stackMap.has(projectName)) {
          stackMap.set(projectName, { services: new Set(), runningCount: 0, total: 0, configFile });
        }

        const entry = stackMap.get(projectName)!;
        entry.services.add(serviceName);
        entry.total += 1;
        if (container.State === 'running') entry.runningCount += 1;
      }

      const data: StackInfo[] = Array.from(stackMap.entries()).map(([name, entry]) => {
        let status: StackInfo['status'];
        if (entry.runningCount === 0) status = 'stopped';
        else if (entry.runningCount === entry.total) status = 'running';
        else status = 'partial';

        return {
          name,
          services: Array.from(entry.services),
          status,
          configFile: entry.configFile,
        };
      });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Run docker compose up -d for a given yaml file path
  ipcMain.handle(
    IPC.COMPOSE_UP,
    async (_event, { yamlPath }: { yamlPath: string }): Promise<IpcResponse<void>> => {
      try {
        await spawnCommand('docker', ['compose', '-f', yamlPath, 'up', '-d']);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // Run docker compose down for a given yaml file path
  ipcMain.handle(
    IPC.COMPOSE_DOWN,
    async (_event, { yamlPath }: { yamlPath: string }): Promise<IpcResponse<void>> => {
      try {
        await spawnCommand('docker', ['compose', '-f', yamlPath, 'down']);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
