import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Networks } from '../../renderer/pages/Networks';
import type { NetworkInfo } from '../../types/docker';

const makeNetwork = (overrides: Partial<NetworkInfo> = {}): NetworkInfo => ({
  Id: 'net1',
  Name: 'my-network',
  Driver: 'bridge',
  Scope: 'local',
  Internal: false,
  Containers: {},
  Created: new Date().toISOString(),
  IPAM: { Driver: 'default', Config: [] },
  ...overrides,
});

describe('Networks', () => {
  let mockDockerService: {
    listNetworks: ReturnType<typeof vi.fn>;
    createNetwork: ReturnType<typeof vi.fn>;
    removeNetwork: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDockerService = {
      listNetworks: vi.fn().mockResolvedValue([makeNetwork()]),
      createNetwork: vi.fn().mockResolvedValue({ id: 'new-net' }),
      removeNetwork: vi.fn().mockResolvedValue(undefined),
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "Redes" heading', async () => {
    render(<Networks dockerService={mockDockerService} />);
    expect(screen.getByRole('heading', { name: 'Redes' })).toBeInTheDocument();
  });

  it('shows network table after loading', async () => {
    render(<Networks dockerService={mockDockerService} />);
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /Redes/i })).toBeInTheDocument();
    });
    expect(screen.getByText('my-network')).toBeInTheDocument();
  });

  it('create network modal: type name, confirm calls createNetwork', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Networks dockerService={mockDockerService} />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('create-network-btn'));
    expect(screen.getByRole('dialog', { name: 'Criar rede' })).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: /Nome da rede/i });
    await user.type(input, 'my-new-net');
    await user.click(screen.getByTestId('confirm-create-net'));

    await waitFor(() => {
      expect(mockDockerService.createNetwork).toHaveBeenCalledWith('my-new-net', expect.any(String));
    });
  });

  it('tree toggle shows network tree', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Networks dockerService={mockDockerService} />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    expect(screen.queryByTestId('network-tree')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Árvore/i }));
    expect(screen.getByTestId('network-tree')).toBeInTheDocument();
  });

  it('remove network button opens confirm modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listNetworks.mockResolvedValue([makeNetwork({ Id: 'net1', Name: 'custom-net' })]);
    render(<Networks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.getByText('custom-net')).toBeInTheDocument());

    await user.click(screen.getByTestId('remove-net-net1'));
    expect(screen.getByRole('dialog', { name: 'Confirmar remoção' })).toBeInTheDocument();
  });

  it('confirm remove network calls removeNetwork', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listNetworks.mockResolvedValue([makeNetwork({ Id: 'net1', Name: 'custom-net' })]);
    render(<Networks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.getByText('custom-net')).toBeInTheDocument());

    await user.click(screen.getByTestId('remove-net-net1'));
    await user.click(screen.getByTestId('confirm-remove'));

    await waitFor(() => {
      expect(mockDockerService.removeNetwork).toHaveBeenCalledWith('net1');
    });
  });
});
