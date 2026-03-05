import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../renderer/hooks/useTheme';

// Mock the themeService to avoid actual DOM manipulation in tests.
// The alias '@/services/themeService' resolves to 'src/renderer/services/themeService'.
// Vitest resolves aliases in vi.mock calls, so we can use either form.
vi.mock('@/services/themeService', () => ({
  themeService: {
    applyDark: vi.fn(),
    applyLight: vi.fn(),
    getPreferred: vi.fn(() => 'light'),
    applyPreferred: vi.fn(),
  },
}));

// Import after mock so we get the mocked version.
// Use same alias as in vi.mock so Vitest serves the same mocked module.
import { themeService } from '@/services/themeService';

const STORAGE_KEY = 'theme-preference';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default: matchMedia returns false (no dark preference)
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('falls back to system preference when no localStorage value is set', () => {
    // themeService.getPreferred returns 'light' per mock above
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('applies light theme when system preference is light and no storage', () => {
    renderHook(() => useTheme());
    expect(themeService.applyLight).toHaveBeenCalled();
    expect(themeService.applyDark).not.toHaveBeenCalled();
  });

  it('applies dark theme when system preference is dark', () => {
    (themeService.getPreferred as ReturnType<typeof vi.fn>).mockReturnValue('dark');
    renderHook(() => useTheme());
    expect(themeService.applyDark).toHaveBeenCalled();
  });

  it('restores dark theme from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(true);
    expect(themeService.applyDark).toHaveBeenCalled();
  });

  it('restores light theme from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);
    expect(themeService.applyLight).toHaveBeenCalled();
  });

  it('toggleTheme switches from light to dark', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(true);
  });

  it('toggleTheme switches from dark to light', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(false);
  });

  it('toggleTheme can be called multiple times', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    expect(result.current.isDark).toBe(true);

    act(() => result.current.toggleTheme());
    expect(result.current.isDark).toBe(false);

    act(() => result.current.toggleTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('persists theme preference to localStorage after toggle', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('persists back to light when toggled from dark', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('applies dark theme via themeService after toggling to dark', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());

    vi.clearAllMocks();

    act(() => {
      result.current.toggleTheme();
    });

    expect(themeService.applyDark).toHaveBeenCalled();
    expect(themeService.applyLight).not.toHaveBeenCalled();
  });

  it('applies light theme via themeService after toggling to light', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    vi.clearAllMocks();

    act(() => {
      result.current.toggleTheme();
    });

    expect(themeService.applyLight).toHaveBeenCalled();
    expect(themeService.applyDark).not.toHaveBeenCalled();
  });

  it('returns the correct theme object for dark preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    // darkHighContrastTheme has bgPrimary: '#000000'
    expect(result.current.theme.colors.bgPrimary).toBe('#000000');
    expect(result.current.theme.colors.fgPrimary).toBe('#FFFFFF');
  });

  it('returns the correct theme object for light preference', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());

    // lightHighContrastTheme has bgPrimary: '#FFFFFF'
    expect(result.current.theme.colors.bgPrimary).toBe('#FFFFFF');
    expect(result.current.theme.colors.fgPrimary).toBe('#000000');
  });

  it('ignores invalid localStorage values and falls back to system preference', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-value');
    (themeService.getPreferred as ReturnType<typeof vi.fn>).mockReturnValue('dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(true);
  });
});
