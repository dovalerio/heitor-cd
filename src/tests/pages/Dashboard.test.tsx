import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../../renderer/pages/Dashboard';
import type { ContainerInfo } from '../../types/docker';

const makeContainer = (overrides: Partial<ContainerInfo> = {}): ContainerInfo => ({
  Id: 'abc123',
  Names: ['/my-container'],
  Image: 'nginx:latest',
  ImageID: 'sha256:abc',
  Command: 'nginx',
  Created: Date.now(),
  Status: 'Up 5 minutes',
  State: 'running',
  Ports: [],
  Labels: {},
  ...overrides,
});

const runningContainer = makeContainer({ Id: 'c1', Names: ['/container-one'], State: 'running' });
const stoppedContainer = makeContainer({ Id: 'c2', Names: ['/container-two'], State: 'exited' });

describe('Dashboard', () => {
  let mockDockerService: {
    listContainers: ReturnType<typeof vi.fn>;
    startContainer: ReturnType<typeof vi.fn>;
    stopContainer: ReturnType<typeof vi.fn>;
    removeContainer: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDockerService = {
      listContainers: vi.fn().mockResolvedValue([]),
      startContainer: vi.fn().mockResolvedValue(undefined),
      stopContainer: vi.fn().mockResolvedValue(undefined),
      removeContainer: vi.fn().mockResolvedValue(undefined),
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "Dashboard" heading', async () => {
    render(<Dashboard dockerService={mockDockerService} />);
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows loading state initially then table after load', async () => {
    mockDockerService.listContainers.mockResolvedValue([]);
    render(<Dashboard dockerService={mockDockerService} />);

    // Loading state
    expect(screen.getByRole('status', { name: 'Carregando containers...' })).toBeInTheDocument();

    // Wait for load
    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Carregando containers...' }),
      ).not.toBeInTheDocument();
    });

    // Table should appear
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows containers returned from listContainers', async () => {
    mockDockerService.listContainers.mockResolvedValue([runningContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByText('container-one')).toBeInTheDocument();
    });
    expect(screen.getByText('nginx:latest')).toBeInTheDocument();
  });

  it('toggling "Mostrando todos" calls listContainers(true)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listContainers.mockResolvedValue([]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    const toggle = screen.getByTestId('toggle-stopped');
    await user.click(toggle);

    await waitFor(() => {
      // After toggle checked=true, listContainers should be called with true
      expect(mockDockerService.listContainers).toHaveBeenCalledWith(true);
    });
  });

  it('clicking "Parar" on a running container calls stopContainer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listContainers.mockResolvedValue([runningContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.getByText('container-one')).toBeInTheDocument());

    const stopBtn = screen.getByTestId('stop-c1');
    await user.click(stopBtn);

    await waitFor(() => {
      expect(mockDockerService.stopContainer).toHaveBeenCalledWith('c1');
    });
  });

  it('clicking "Iniciar" on a stopped container calls startContainer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listContainers.mockResolvedValue([stoppedContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.getByText('container-two')).toBeInTheDocument());

    const startBtn = screen.getByTestId('start-c2');
    await user.click(startBtn);

    await waitFor(() => {
      expect(mockDockerService.startContainer).toHaveBeenCalledWith('c2');
    });
  });

  it('remove button opens confirm modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listContainers.mockResolvedValue([runningContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.getByText('container-one')).toBeInTheDocument());

    const removeBtn = screen.getByTestId('remove-c1');
    await user.click(removeBtn);

    expect(screen.getByRole('dialog', { name: 'Confirmar remoção' })).toBeInTheDocument();
  });

  it('confirming removal calls removeContainer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listContainers.mockResolvedValue([runningContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.getByText('container-one')).toBeInTheDocument());

    // Open remove modal
    await user.click(screen.getByTestId('remove-c1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Confirm remove
    await user.click(screen.getByTestId('confirm-remove'));

    await waitFor(() => {
      expect(mockDockerService.removeContainer).toHaveBeenCalledWith('c1', true);
    });
  });

  it('search filters containers by name', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listContainers.mockResolvedValue([runningContainer, stoppedContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByText('container-one')).toBeInTheDocument();
      expect(screen.getByText('container-two')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('container-search');
    await user.type(searchInput, 'one');

    expect(screen.getByText('container-one')).toBeInTheDocument();
    expect(screen.queryByText('container-two')).not.toBeInTheDocument();
  });

  it('status badge is shown for each container', async () => {
    mockDockerService.listContainers.mockResolvedValue([runningContainer, stoppedContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByTestId('status-c1')).toBeInTheDocument();
      expect(screen.getByTestId('status-c2')).toBeInTheDocument();
    });
  });

  it('shows error state when listContainers rejects', async () => {
    mockDockerService.listContainers.mockRejectedValue(new Error('Connection failed'));
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Connection failed');
    });
  });

  it('table has aria-label with count', async () => {
    mockDockerService.listContainers.mockResolvedValue([runningContainer]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('1'));
    });
  });

  it('shows "Nenhum container encontrado" when list is empty after load', async () => {
    mockDockerService.listContainers.mockResolvedValue([]);
    render(<Dashboard dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum container encontrado.')).toBeInTheDocument();
    });
  });

  it('renders the search input', async () => {
    mockDockerService.listContainers.mockResolvedValue([]);
    render(<Dashboard dockerService={mockDockerService} />);

    expect(screen.getByTestId('container-search')).toBeInTheDocument();
  });
});
