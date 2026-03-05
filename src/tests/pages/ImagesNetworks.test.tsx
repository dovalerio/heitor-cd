import React from 'react';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImagesNetworks } from '../../renderer/pages/ImagesNetworks';
import type { ImageInfo, NetworkInfo } from '../../types/docker';

const makeImage = (overrides: Partial<ImageInfo> = {}): ImageInfo => ({
  Id: 'sha256:img1',
  RepoTags: ['nginx:latest'],
  RepoDigests: [],
  Created: Math.floor(Date.now() / 1000),
  Size: 50 * 1024 * 1024,
  VirtualSize: 50 * 1024 * 1024,
  Labels: null,
  ...overrides,
});

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

describe('ImagesNetworks', () => {
  let mockDockerService: {
    listImages: ReturnType<typeof vi.fn>;
    listNetworks: ReturnType<typeof vi.fn>;
    removeImage: ReturnType<typeof vi.fn>;
    removeNetwork: ReturnType<typeof vi.fn>;
    pullImage: ReturnType<typeof vi.fn>;
    createNetwork: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDockerService = {
      listImages: vi.fn().mockResolvedValue([makeImage()]),
      listNetworks: vi.fn().mockResolvedValue([makeNetwork()]),
      removeImage: vi.fn().mockResolvedValue(undefined),
      removeNetwork: vi.fn().mockResolvedValue(undefined),
      pullImage: vi.fn().mockResolvedValue(undefined),
      createNetwork: vi.fn().mockResolvedValue({ id: 'new-net' }),
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "Images & Networks" heading', async () => {
    render(<ImagesNetworks dockerService={mockDockerService} />);
    expect(screen.getByRole('heading', { name: 'Images & Networks' })).toBeInTheDocument();
  });

  it('tab "Imagens" shows image table by default', async () => {
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByRole('table', { name: /Imagens/i })).toBeInTheDocument();
    });
    expect(screen.getByText('nginx:latest')).toBeInTheDocument();
  });

  it('tab "Redes" shows network table when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    const networksTab = screen.getByRole('tab', { name: 'Redes' });
    await user.click(networksTab);

    await waitFor(() => {
      expect(screen.getByRole('table', { name: /Redes/i })).toBeInTheDocument();
    });
    expect(screen.getByText('my-network')).toBeInTheDocument();
  });

  it('tab keyboard navigation: images tab has aria-selected=true by default', async () => {
    render(<ImagesNetworks dockerService={mockDockerService} />);
    const imagesTab = screen.getByRole('tab', { name: 'Imagens' });
    expect(imagesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking Networks tab sets aria-selected=true on it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    const networksTab = screen.getByRole('tab', { name: 'Redes' });
    await user.click(networksTab);

    expect(networksTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Imagens' })).toHaveAttribute('aria-selected', 'false');
  });

  it('remove image button opens confirm modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByText('nginx:latest')).toBeInTheDocument();
    });

    const removeBtn = screen.getByTestId('remove-image-sha256:img1');
    await user.click(removeBtn);

    expect(screen.getByRole('dialog', { name: 'Confirmar remoção' })).toBeInTheDocument();
  });

  it('confirming remove image calls removeImage', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => {
      expect(screen.getByText('nginx:latest')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('remove-image-sha256:img1'));
    expect(screen.getByRole('dialog', { name: 'Confirmar remoção' })).toBeInTheDocument();

    await user.click(screen.getByTestId('confirm-remove'));

    await waitFor(() => {
      expect(mockDockerService.removeImage).toHaveBeenCalledWith('sha256:img1', true);
    });
  });

  it('pull image modal: open, type name, confirm calls pullImage', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    // Open pull modal
    await user.click(screen.getByTestId('pull-btn'));
    expect(screen.getByRole('dialog', { name: 'Pull de imagem' })).toBeInTheDocument();

    // Type image name
    const input = screen.getByRole('textbox', { name: /Nome da imagem/i });
    await user.type(input, 'redis:7');

    // Click pull
    await user.click(screen.getByTestId('confirm-pull'));

    await waitFor(() => {
      expect(mockDockerService.pullImage).toHaveBeenCalledWith('redis:7');
    });
  });

  it('create network modal: type name, confirm calls createNetwork', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    // Switch to Networks tab
    await user.click(screen.getByRole('tab', { name: 'Redes' }));

    // Open create network modal
    await user.click(screen.getByTestId('create-network-btn'));
    expect(screen.getByRole('dialog', { name: 'Criar rede' })).toBeInTheDocument();

    // Type network name
    const input = screen.getByRole('textbox', { name: /Nome da rede/i });
    await user.type(input, 'my-new-net');

    // Confirm
    await user.click(screen.getByTestId('confirm-create-net'));

    await waitFor(() => {
      expect(mockDockerService.createNetwork).toHaveBeenCalledWith('my-new-net', expect.any(String));
    });
  });

  it('tree toggle shows tree for networks tab', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    // Switch to Networks tab
    await user.click(screen.getByRole('tab', { name: 'Redes' }));

    // Initially no tree
    expect(screen.queryByTestId('network-tree')).not.toBeInTheDocument();

    // Click tree toggle button
    const treeBtn = screen.getByRole('button', { name: /Árvore/i });
    await user.click(treeBtn);

    expect(screen.getByTestId('network-tree')).toBeInTheDocument();
  });

  it('cancel button on pull image modal closes it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('pull-btn'));
    expect(screen.getByRole('dialog', { name: 'Pull de imagem' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Pull de imagem' })).not.toBeInTheDocument();
    });
  });

  it('remove network button opens confirm modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    // Use a non-system network (system networks bridge/host/none are disabled)
    mockDockerService.listNetworks.mockResolvedValue([makeNetwork({ Id: 'net1', Name: 'custom-net' })]);
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: 'Redes' }));

    await waitFor(() => {
      expect(screen.getByText('custom-net')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('remove-net-net1'));
    expect(screen.getByRole('dialog', { name: 'Confirmar remoção' })).toBeInTheDocument();
  });

  it('confirm remove network calls removeNetwork', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    mockDockerService.listNetworks.mockResolvedValue([makeNetwork({ Id: 'net1', Name: 'custom-net' })]);
    render(<ImagesNetworks dockerService={mockDockerService} />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: 'Redes' }));

    await waitFor(() => {
      expect(screen.getByText('custom-net')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('remove-net-net1'));
    await user.click(screen.getByTestId('confirm-remove'));

    await waitFor(() => {
      expect(mockDockerService.removeNetwork).toHaveBeenCalledWith('net1');
    });
  });
});
