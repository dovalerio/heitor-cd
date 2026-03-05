import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Images } from '../../renderer/pages/Images';
import type { ImageInfo } from '../../types/docker';

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

describe('Images', () => {
  let mockDockerService: {
    listImages: ReturnType<typeof vi.fn>;
    removeImage: ReturnType<typeof vi.fn>;
    pullImage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDockerService = {
      listImages: vi.fn().mockResolvedValue([makeImage()]),
      removeImage: vi.fn().mockResolvedValue(undefined),
      pullImage: vi.fn().mockResolvedValue(undefined),
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "Imagens" heading', async () => {
    render(<Images dockerService={mockDockerService} />);
    expect(screen.getByRole('heading', { name: 'Imagens' })).toBeInTheDocument();
  });

  it('shows image table after loading', async () => {
    render(<Images dockerService={mockDockerService} />);
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /Imagens/i })).toBeInTheDocument();
    });
    expect(screen.getByText('nginx:latest')).toBeInTheDocument();
  });

  it('remove image button opens confirm modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Images dockerService={mockDockerService} />);
    await waitFor(() => expect(screen.getByText('nginx:latest')).toBeInTheDocument());

    await user.click(screen.getByTestId('remove-image-sha256:img1'));
    expect(screen.getByRole('dialog', { name: 'Confirmar remoção' })).toBeInTheDocument();
  });

  it('confirming remove image calls removeImage', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Images dockerService={mockDockerService} />);
    await waitFor(() => expect(screen.getByText('nginx:latest')).toBeInTheDocument());

    await user.click(screen.getByTestId('remove-image-sha256:img1'));
    await user.click(screen.getByTestId('confirm-remove'));

    await waitFor(() => {
      expect(mockDockerService.removeImage).toHaveBeenCalledWith('sha256:img1', true);
    });
  });

  it('pull image modal: open, type name, confirm calls pullImage', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Images dockerService={mockDockerService} />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('pull-btn'));
    expect(screen.getByRole('dialog', { name: 'Pull de imagem' })).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: /Nome da imagem/i });
    await user.type(input, 'redis:7');
    await user.click(screen.getByTestId('confirm-pull'));

    await waitFor(() => {
      expect(mockDockerService.pullImage).toHaveBeenCalledWith('redis:7');
    });
  });

  it('cancel button on pull image modal closes it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<Images dockerService={mockDockerService} />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('pull-btn'));
    expect(screen.getByRole('dialog', { name: 'Pull de imagem' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Pull de imagem' })).not.toBeInTheDocument();
    });
  });
});
