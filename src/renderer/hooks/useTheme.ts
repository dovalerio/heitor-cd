/**
 * useTheme - Hook for managing and persisting the application colour theme
 */

import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '@/styles/theme';
import {
  darkHighContrastTheme,
  lightHighContrastTheme,
} from '@/styles/theme';
import { themeService } from '@/services/themeService';

type ThemePreference = 'dark' | 'light';

const STORAGE_KEY = 'theme-preference';

const themeForPreference = (pref: ThemePreference): Theme =>
  pref === 'dark' ? darkHighContrastTheme : lightHighContrastTheme;

export const useTheme = () => {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    // Hydrate from localStorage, fall back to system preference
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return themeService.getPreferred();
  });

  // Apply theme whenever the preference changes
  useEffect(() => {
    if (preference === 'dark') {
      themeService.applyDark();
    } else {
      themeService.applyLight();
    }
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setPreference(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme: themeForPreference(preference),
    isDark: preference === 'dark',
    toggleTheme,
  };
};
