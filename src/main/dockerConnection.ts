import Docker from 'dockerode';

/**
 * Detect and return a Dockerode instance connected to the local Docker daemon.
 * Tries platform-specific socket paths in order and throws if none are reachable.
 */
export async function getDockerConnection(): Promise<Docker> {
  const platform = process.platform;

  const socketPaths: string[] =
    platform === 'win32'
      ? ['\\\\.\\pipe\\docker_engine', '/mnt/wsl/shared-docker/docker.sock']
      : ['/var/run/docker.sock'];

  let lastError: Error = new Error('Docker socket not found');

  for (const socketPath of socketPaths) {
    try {
      const docker = new Docker({ socketPath });
      await docker.ping();
      return docker;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(
    `Unable to connect to Docker daemon. Tried: ${socketPaths.join(', ')}. Last error: ${lastError.message}`,
  );
}
