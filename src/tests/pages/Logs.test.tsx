import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logs } from '../../renderer/pages/Logs';
import type { ContainerInfo, LogLine } from '../../types/docker';

const makeContainer = (overrides: Partial<ContainerInfo> = {}): ContainerInfo => ({
  Id: 'c1',
  Names: ['/test'],
  Image: 'nginx:latest',
  ImageID: 'sha256:abc',
  Command: 'nginx',
  Created: Date.now(),
  Status: 'Up',
  State: 'running',
  Ports: [],
  Labels: {},
  ...overrides,
});

const stdoutLine: LogLine = {
  containerId: 'c1',
  containerName: 'test',
  stream: 'stdout',
  timestamp: new Date().toISOString(),
  message: 'Hello stdout',
};

const stderrLine: LogLine = {
  containerId: 'c1',
  containerName: 'test',
  stream: 'stderr',
  timestamp: new Date().toISOString(),
  message: 'Error stderr',
};

describe('Logs', () => {
  let mockDockerService: {
    listContainers: ReturnType<typeof vi.fn>;
    getContainerLogs: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDockerService = {
      listContainers: vi.fn().mockResolvedValue([makeContainer()]),
      getContainerLogs: vi.fn().mockResolvedValue([stdoutLine, stderrLine]),
    };
    vi.useFakeTimers();

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "Logs" heading', () => {
    render(<Logs dockerService={mockDockerService} />);
    expect(screen.getByRole('heading', { name: 'Logs' })).toBeInTheDocument();
  });

  it('shows container selector', async () => {
    render(<Logs dockerService={mockDockerService} />);
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Selecionar container' })).toBeInTheDocument();
    });
  });

  it('selecting a container calls getContainerLogs', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Logs dockerService={mockDockerService} />);

    // Wait for containers to load
    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: 'Selecionar container' });
      expect(select).not.toHaveDisplayValue('— Selecione —');
    });

    const select = screen.getByRole('combobox', { name: 'Selecionar container' });
    await user.selectOptions(select, 'c1');

    await waitFor(() => {
      expect(mockDockerService.getContainerLogs).toHaveBeenCalledWith('c1', expect.any(Number), expect.any(Boolean));
    });
  });

  it('log lines are rendered in the output', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Logs dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Selecionar container' })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: 'Selecionar container' });
    await user.selectOptions(select, 'c1');

    await waitFor(() => {
      expect(screen.getByText('Hello stdout')).toBeInTheDocument();
      expect(screen.getByText('Error stderr')).toBeInTheDocument();
    });
  });

  it('STDERR toggle filters to only stderr lines', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Logs dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Selecionar container' })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: 'Selecionar container' });
    await user.selectOptions(select, 'c1');

    await waitFor(() => {
      expect(screen.getByText('Hello stdout')).toBeInTheDocument();
    });

    // Enable STDERR toggle
    const stderrToggle = screen.getByTestId('stderr-toggle');
    await user.click(stderrToggle);

    expect(screen.queryByText('Hello stdout')).not.toBeInTheDocument();
    expect(screen.getByText('Error stderr')).toBeInTheDocument();
  });

  it('Copy STDERR button calls navigator.clipboard.writeText', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Logs dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Selecionar container' })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: 'Selecionar container' });
    await user.selectOptions(select, 'c1');

    await waitFor(() => {
      expect(screen.getByText('Error stderr')).toBeInTheDocument();
    });

    const copyBtn = screen.getByTestId('copy-stderr-btn');
    await user.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Error stderr')
    );
  });

  it('shows loading state while fetching logs', async () => {
    let resolveGetLogs: (value: LogLine[]) => void;
    mockDockerService.getContainerLogs.mockReturnValue(
      new Promise<LogLine[]>((resolve) => { resolveGetLogs = resolve; })
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Logs dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Selecionar container' })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: 'Selecionar container' });
    await user.selectOptions(select, 'c1');

    expect(screen.getByRole('status', { name: 'Carregando logs...' })).toBeInTheDocument();

    // Resolve to unblock
    act(() => { resolveGetLogs!([]); });
  });

  it('shows empty state when no container is selected', async () => {
    render(<Logs dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Selecionar container' })).toBeInTheDocument();
    });

    // No container selected → empty state message
    expect(screen.getByText('Selecione um container para visualizar os logs.')).toBeInTheDocument();
  });

  it('log output area has role="log"', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Logs dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Selecionar container' })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: 'Selecionar container' });
    await user.selectOptions(select, 'c1');

    await waitFor(() => {
      expect(screen.getByRole('log')).toBeInTheDocument();
    });
  });

  it('initialContainerId prop pre-selects the container and loads logs', async () => {
    render(
      <Logs
        dockerService={mockDockerService}
        initialContainerId="c1"
        initialContainerName="test"
      />
    );

    await waitFor(() => {
      expect(mockDockerService.getContainerLogs).toHaveBeenCalledWith('c1', expect.any(Number), expect.any(Boolean));
    });
  });

  it('shows containers in the selector dropdown', async () => {
    const containers = [
      makeContainer({ Id: 'c1', Names: ['/alpha'] }),
      makeContainer({ Id: 'c2', Names: ['/beta'], State: 'exited' }),
    ];
    mockDockerService.listContainers.mockResolvedValue(containers);

    render(<Logs dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /alpha/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /beta/ })).toBeInTheDocument();
    });
  });
});
