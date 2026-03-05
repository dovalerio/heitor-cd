import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keymapsService } from '../../renderer/services/keymapsService';

const mockInvoke = vi.fn();

beforeEach(() => {
  (window as any).electronAPI = {
    invoke: mockInvoke,
    on: vi.fn(),
    off: vi.fn(),
  };
});

describe('keymapsService.load', () => {
  it('calls invoke with KEYMAPS_LOAD channel and returns data', async () => {
    const keymapData = {
      version: 1,
      description: 'Default keymaps',
      shortcuts: {
        'app.goDashboard': 'Ctrl+1',
        'app.goComposer': 'Ctrl+2',
      },
    };
    mockInvoke.mockResolvedValueOnce({ success: true, data: keymapData });

    const result = await keymapsService.load();

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('keymaps:load', undefined);
    expect(result).toEqual(keymapData);
  });

  it('throws an error when success is false', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'File not found' });

    await expect(keymapsService.load()).rejects.toThrow('File not found');
  });

  it('throws a generic error when success is false with no error message', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false });

    await expect(keymapsService.load()).rejects.toThrow('IPC call failed: keymaps:load');
  });
});

describe('keymapsService.save', () => {
  it('calls invoke with KEYMAPS_SAVE and the shortcuts argument', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    const shortcuts = { 'app.goDashboard': 'Ctrl+1', 'modal.close': 'Escape' };
    await keymapsService.save(shortcuts);

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('keymaps:save', { shortcuts });
  });

  it('throws when save fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Permission denied' });

    await expect(keymapsService.save({})).rejects.toThrow('Permission denied');
  });

  it('resolves to undefined on success', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    const result = await keymapsService.save({ 'app.goLogs': 'Ctrl+L' });

    expect(result).toBeUndefined();
  });
});

describe('keymapsService.openFile', () => {
  it('calls invoke with KEYMAPS_OPEN_FILE channel', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: undefined });

    await keymapsService.openFile();

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('keymaps:openFile', undefined);
  });

  it('throws when openFile fails', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'No default editor' });

    await expect(keymapsService.openFile()).rejects.toThrow('No default editor');
  });
});

describe('keymapsService.parseShortcut', () => {
  it('parses Ctrl+K correctly', () => {
    const result = keymapsService.parseShortcut('Ctrl+K');
    expect(result.ctrl).toBe(true);
    expect(result.key).toBe('K');
    expect(result.alt).toBe(false);
    expect(result.shift).toBe(false);
    expect(result.meta).toBe(false);
  });

  it('parses Alt+Shift+S correctly', () => {
    const result = keymapsService.parseShortcut('Alt+Shift+S');
    expect(result.alt).toBe(true);
    expect(result.shift).toBe(true);
    expect(result.ctrl).toBe(false);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('S');
  });

  it('parses Escape shortcut', () => {
    const result = keymapsService.parseShortcut('Escape');
    expect(result.key).toBe('Escape');
    expect(result.ctrl).toBe(false);
  });

  it('parses Space shortcut', () => {
    const result = keymapsService.parseShortcut('Space');
    expect(result.key).toBe(' ');
  });

  it('parses Ctrl+Shift+Z', () => {
    const result = keymapsService.parseShortcut('Ctrl+Shift+Z');
    expect(result.ctrl).toBe(true);
    expect(result.shift).toBe(true);
    expect(result.key).toBe('Z');
  });
});
