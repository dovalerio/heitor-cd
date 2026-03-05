import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dockerService } from '../../renderer/services/dockerService';

const mockInvoke = vi.fn();

beforeEach(() => {
  (window as any).electronAPI = {
    invoke: mockInvoke,
    on: vi.fn(),
    off: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

describe('dockerService.listContainers', () => {
  it('invokes CONTAINER_LIST with {all: true} and returns data', async () => {
    const containers = [{ id: 'abc123', name: 'my-container', status: 'running' }];
    mockInvoke.mockResolvedValueOnce({ success: true, data: containers });

    const result = await dockerService.listContainers(true);

    expect(mockInvoke).toHaveBeenCalledWith('container:list', { all: true });
    expect(result).toEqual(containers);
  });

  it('invokes CONTAINER_LIST with {all: false} by default', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: [] });

    await dockerService.listContainers();

    expect(mockInvoke).toHaveBeenCalledWith('container:list', { all: false });
  });

  it('throws when success is false', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Docker not running' });

    await expect(dockerService.listContainers()).rejects.toThrow('Docker not running');
  });
});

describe('dockerService.startContainer', () => {
  it('invokes CONTAINER_START with {id}', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.startContainer('container-id-1');

    expect(mockInvoke).toHaveBeenCalledWith('container:start', { id: 'container-id-1' });
  });

  it('throws when start fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Container not found' });

    await expect(dockerService.startContainer('bad-id')).rejects.toThrow('Container not found');
  });
});

describe('dockerService.stopContainer', () => {
  it('invokes CONTAINER_STOP with {id}', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.stopContainer('container-id-2');

    expect(mockInvoke).toHaveBeenCalledWith('container:stop', { id: 'container-id-2' });
  });

  it('throws when stop fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Already stopped' });

    await expect(dockerService.stopContainer('id')).rejects.toThrow('Already stopped');
  });
});

describe('dockerService.removeContainer', () => {
  it('invokes CONTAINER_REMOVE with {id, force: true}', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.removeContainer('container-id-3', true);

    expect(mockInvoke).toHaveBeenCalledWith('container:remove', {
      id: 'container-id-3',
      force: true,
    });
  });

  it('invokes CONTAINER_REMOVE with force: false by default', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.removeContainer('container-id-4');

    expect(mockInvoke).toHaveBeenCalledWith('container:remove', {
      id: 'container-id-4',
      force: false,
    });
  });

  it('throws when remove fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Cannot remove running container' });

    await expect(dockerService.removeContainer('id')).rejects.toThrow(
      'Cannot remove running container',
    );
  });
});

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

describe('dockerService.listImages', () => {
  it('invokes IMAGE_LIST and returns image list', async () => {
    const images = [{ id: 'img1', repoTags: ['nginx:latest'], size: 12345 }];
    mockInvoke.mockResolvedValueOnce({ success: true, data: images });

    const result = await dockerService.listImages();

    expect(mockInvoke).toHaveBeenCalledWith('image:list', undefined);
    expect(result).toEqual(images);
  });

  it('throws when image list fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Images unavailable' });

    await expect(dockerService.listImages()).rejects.toThrow('Images unavailable');
  });
});

describe('dockerService.removeImage', () => {
  it('invokes IMAGE_REMOVE with {id, force: false} by default', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.removeImage('img-id-1');

    expect(mockInvoke).toHaveBeenCalledWith('image:remove', { id: 'img-id-1', force: false });
  });

  it('invokes IMAGE_REMOVE with force: true when specified', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.removeImage('img-id-2', true);

    expect(mockInvoke).toHaveBeenCalledWith('image:remove', { id: 'img-id-2', force: true });
  });

  it('throws when remove image fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Image in use' });

    await expect(dockerService.removeImage('img-id')).rejects.toThrow('Image in use');
  });
});

describe('dockerService.pullImage', () => {
  it('invokes IMAGE_PULL with {name}', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.pullImage('nginx');

    expect(mockInvoke).toHaveBeenCalledWith('image:pull', { name: 'nginx' });
  });

  it('invokes IMAGE_PULL with full image name including tag', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.pullImage('postgres:15');

    expect(mockInvoke).toHaveBeenCalledWith('image:pull', { name: 'postgres:15' });
  });

  it('throws when pull fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Image not found in registry' });

    await expect(dockerService.pullImage('nonexistent')).rejects.toThrow(
      'Image not found in registry',
    );
  });
});

// ---------------------------------------------------------------------------
// Networks
// ---------------------------------------------------------------------------

describe('dockerService.listNetworks', () => {
  it('invokes NETWORK_LIST and returns networks', async () => {
    const networks = [{ id: 'net1', name: 'bridge', driver: 'bridge' }];
    mockInvoke.mockResolvedValueOnce({ success: true, data: networks });

    const result = await dockerService.listNetworks();

    expect(mockInvoke).toHaveBeenCalledWith('network:list', undefined);
    expect(result).toEqual(networks);
  });

  it('throws when network list fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Network error' });

    await expect(dockerService.listNetworks()).rejects.toThrow('Network error');
  });
});

describe('dockerService.createNetwork', () => {
  it('invokes NETWORK_CREATE with {name, driver}', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: { id: 'new-net-id' } });

    const result = await dockerService.createNetwork('mynet', 'bridge');

    expect(mockInvoke).toHaveBeenCalledWith('network:create', { name: 'mynet', driver: 'bridge' });
    expect(result).toEqual({ id: 'new-net-id' });
  });

  it('uses bridge as default driver', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: { id: 'net-id' } });

    await dockerService.createNetwork('mynet2');

    expect(mockInvoke).toHaveBeenCalledWith('network:create', { name: 'mynet2', driver: 'bridge' });
  });

  it('throws when network creation fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Network name already in use' });

    await expect(dockerService.createNetwork('existing')).rejects.toThrow(
      'Network name already in use',
    );
  });
});

describe('dockerService.removeNetwork', () => {
  it('invokes NETWORK_REMOVE with {id}', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await dockerService.removeNetwork('net-id-1');

    expect(mockInvoke).toHaveBeenCalledWith('network:remove', { id: 'net-id-1' });
  });

  it('throws when network removal fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Network has active endpoints' });

    await expect(dockerService.removeNetwork('net-id')).rejects.toThrow(
      'Network has active endpoints',
    );
  });
});

// ---------------------------------------------------------------------------
// Compose
// ---------------------------------------------------------------------------

describe('dockerService.parseCompose', () => {
  it('invokes COMPOSE_PARSE with {yaml} and returns services', async () => {
    const yaml = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const services = [{ name: 'web', image: 'nginx' }];
    mockInvoke.mockResolvedValueOnce({ success: true, data: services });

    const result = await dockerService.parseCompose(yaml);

    expect(mockInvoke).toHaveBeenCalledWith('compose:parse', { yaml });
    expect(result).toEqual(services);
  });

  it('throws when parse fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Invalid YAML' });

    await expect(dockerService.parseCompose('invalid: yaml: :')).rejects.toThrow('Invalid YAML');
  });
});

describe('dockerService.exportCompose', () => {
  it('invokes COMPOSE_EXPORT with {services} and returns yaml string', async () => {
    const services = [{ name: 'web', image: 'nginx' }] as any[];
    const yamlOutput = 'version: "3"\nservices:\n  web:\n    image: nginx\n';
    mockInvoke.mockResolvedValueOnce({ success: true, data: yamlOutput });

    const result = await dockerService.exportCompose(services);

    expect(mockInvoke).toHaveBeenCalledWith('compose:export', { services });
    expect(result).toBe(yamlOutput);
  });

  it('throws when export fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Export failed' });

    await expect(dockerService.exportCompose([])).rejects.toThrow('Export failed');
  });
});

describe('dockerService.listStacks', () => {
  it('invokes COMPOSE_STACKS and returns stacks', async () => {
    const stacks = [{ name: 'my-app', path: '/home/user/my-app/docker-compose.yml', services: [] }];
    mockInvoke.mockResolvedValueOnce({ success: true, data: stacks });

    const result = await dockerService.listStacks();

    expect(mockInvoke).toHaveBeenCalledWith('compose:stacks', undefined);
    expect(result).toEqual(stacks);
  });

  it('throws when listing stacks fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Stacks unavailable' });

    await expect(dockerService.listStacks()).rejects.toThrow('Stacks unavailable');
  });
});

// ---------------------------------------------------------------------------
// Generic error handling
// ---------------------------------------------------------------------------

describe('dockerService error handling', () => {
  it('throws Error with the message from the IPC response', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Custom error message' });

    let thrown: unknown;
    try {
      await dockerService.listContainers();
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('Custom error message');
  });

  it('throws a generic IPC error when no error message is provided', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false });

    await expect(dockerService.listContainers()).rejects.toThrow('IPC call failed: container:list');
  });
});
