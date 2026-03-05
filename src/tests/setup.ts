import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.electronAPI (not available in jsdom)
(window as any).electronAPI = {
  invoke: vi.fn().mockResolvedValue({ success: true, data: undefined }),
  on: vi.fn(),
  off: vi.fn(),
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// Mock scrollIntoView — not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
