import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZoom, useZoomKeyboardShortcuts } from '../../renderer/hooks/useZoom';

const STORAGE_KEY = 'app-zoom-level';
const ZOOM_LEVELS = [80, 90, 100, 110, 125, 150, 175, 200];

describe('useZoom', () => {
  beforeEach(() => {
    // Clean up body classes before each test
    ZOOM_LEVELS.forEach((level) => document.body.classList.remove(`zoom-${level}`));
    localStorage.clear();
    // Clean up any live region elements
    document.querySelectorAll('[aria-live]').forEach((el) => el.remove());
  });

  afterEach(() => {
    ZOOM_LEVELS.forEach((level) => document.body.classList.remove(`zoom-${level}`));
    document.querySelectorAll('[aria-live]').forEach((el) => el.remove());
  });

  it('initializes with zoomLevel 100 when no localStorage value is set', () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoomLevel).toBe(100);
  });

  it('restores zoomLevel from localStorage if a valid level is stored', () => {
    localStorage.setItem(STORAGE_KEY, '150');
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoomLevel).toBe(150);
  });

  it('falls back to 100 if localStorage has an invalid level', () => {
    localStorage.setItem(STORAGE_KEY, '75');
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoomLevel).toBe(100);
  });

  it('falls back to 100 if localStorage has non-numeric value', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number');
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoomLevel).toBe(100);
  });

  it('increaseZoom increments through ZOOM_LEVELS', () => {
    const { result } = renderHook(() => useZoom());

    // Start at 100 (index 2), next should be 110 (index 3)
    act(() => {
      result.current.increaseZoom();
    });
    expect(result.current.zoomLevel).toBe(110);

    act(() => {
      result.current.increaseZoom();
    });
    expect(result.current.zoomLevel).toBe(125);
  });

  it('increaseZoom does not exceed the maximum zoom level', () => {
    localStorage.setItem(STORAGE_KEY, '200');
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.increaseZoom();
    });

    expect(result.current.zoomLevel).toBe(200);
  });

  it('decreaseZoom decrements through ZOOM_LEVELS', () => {
    const { result } = renderHook(() => useZoom());

    // Start at 100 (index 2), previous should be 90 (index 1)
    act(() => {
      result.current.decreaseZoom();
    });
    expect(result.current.zoomLevel).toBe(90);

    act(() => {
      result.current.decreaseZoom();
    });
    expect(result.current.zoomLevel).toBe(80);
  });

  it('decreaseZoom does not go below the minimum zoom level', () => {
    localStorage.setItem(STORAGE_KEY, '80');
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.decreaseZoom();
    });

    expect(result.current.zoomLevel).toBe(80);
  });

  it('resetZoom returns to 100', () => {
    localStorage.setItem(STORAGE_KEY, '175');
    const { result } = renderHook(() => useZoom());

    expect(result.current.zoomLevel).toBe(175);

    act(() => {
      result.current.resetZoom();
    });

    expect(result.current.zoomLevel).toBe(100);
  });

  it('setZoom sets zoom to a valid level', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.setZoom(150);
    });

    expect(result.current.zoomLevel).toBe(150);
  });

  it('setZoom ignores an invalid level', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.setZoom(75 as any);
    });

    // Should remain at 100 (default)
    expect(result.current.zoomLevel).toBe(100);
  });

  it('setZoom ignores another invalid level (not in ZOOM_LEVELS)', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.setZoom(133 as any);
    });

    expect(result.current.zoomLevel).toBe(100);
  });

  it('applies zoom class to document.body after change', () => {
    const { result } = renderHook(() => useZoom());

    // Initial render should have zoom-100
    expect(document.body.classList.contains('zoom-100')).toBe(true);

    act(() => {
      result.current.increaseZoom();
    });

    expect(document.body.classList.contains('zoom-110')).toBe(true);
    expect(document.body.classList.contains('zoom-100')).toBe(false);
  });

  it('removes old zoom classes when applying a new one', () => {
    localStorage.setItem(STORAGE_KEY, '150');
    const { result } = renderHook(() => useZoom());

    // Should only have zoom-150
    ZOOM_LEVELS.filter((l) => l !== 150).forEach((level) => {
      expect(document.body.classList.contains(`zoom-${level}`)).toBe(false);
    });
    expect(document.body.classList.contains('zoom-150')).toBe(true);

    act(() => {
      result.current.resetZoom();
    });

    expect(document.body.classList.contains('zoom-100')).toBe(true);
    expect(document.body.classList.contains('zoom-150')).toBe(false);
  });

  it('persists zoomLevel to localStorage on change', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.setZoom(125);
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('125');
  });

  it('returns correct zoomPercentage string', () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoomPercentage).toBe('100%');

    act(() => {
      result.current.setZoom(175);
    });

    expect(result.current.zoomPercentage).toBe('175%');
  });
});

describe('useZoomKeyboardShortcuts', () => {
  it('Ctrl+= fires onIncreaseZoom', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    const onReset = vi.fn();

    renderHook(() => useZoomKeyboardShortcuts(onIncrease, onDecrease, onReset));

    const event = new KeyboardEvent('keydown', { key: '=', ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(onIncrease).toHaveBeenCalledOnce();
    expect(onDecrease).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('Ctrl++ fires onIncreaseZoom', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    const onReset = vi.fn();

    renderHook(() => useZoomKeyboardShortcuts(onIncrease, onDecrease, onReset));

    const event = new KeyboardEvent('keydown', { key: '+', ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(onIncrease).toHaveBeenCalledOnce();
  });

  it('Ctrl+- fires onDecreaseZoom', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    const onReset = vi.fn();

    renderHook(() => useZoomKeyboardShortcuts(onIncrease, onDecrease, onReset));

    const event = new KeyboardEvent('keydown', { key: '-', ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(onDecrease).toHaveBeenCalledOnce();
    expect(onIncrease).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('Ctrl+0 fires onResetZoom', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    const onReset = vi.fn();

    renderHook(() => useZoomKeyboardShortcuts(onIncrease, onDecrease, onReset));

    const event = new KeyboardEvent('keydown', { key: '0', ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(onReset).toHaveBeenCalledOnce();
    expect(onIncrease).not.toHaveBeenCalled();
    expect(onDecrease).not.toHaveBeenCalled();
  });

  it('Meta+= fires onIncreaseZoom (Mac Cmd key)', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    const onReset = vi.fn();

    renderHook(() => useZoomKeyboardShortcuts(onIncrease, onDecrease, onReset));

    const event = new KeyboardEvent('keydown', { key: '=', metaKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(onIncrease).toHaveBeenCalledOnce();
  });

  it('unrelated key does not fire any callback', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    const onReset = vi.fn();

    renderHook(() => useZoomKeyboardShortcuts(onIncrease, onDecrease, onReset));

    const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: false, bubbles: true });
    window.dispatchEvent(event);

    expect(onIncrease).not.toHaveBeenCalled();
    expect(onDecrease).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('removes the keydown listener on unmount', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    const onReset = vi.fn();

    const { unmount } = renderHook(() => useZoomKeyboardShortcuts(onIncrease, onDecrease, onReset));

    unmount();

    const event = new KeyboardEvent('keydown', { key: '=', ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(onIncrease).not.toHaveBeenCalled();
  });
});
