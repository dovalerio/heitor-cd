/**
 * themeService.ts - Theme application helpers used by useTheme hook
 */

import {
  applyTheme,
  darkHighContrastTheme,
  lightHighContrastTheme,
} from '@/styles/theme';

export const themeService = {
  /** Applies the dark high-contrast theme to the document root. */
  applyDark(): void {
    applyTheme(darkHighContrastTheme);
  },

  /** Applies the light high-contrast theme to the document root. */
  applyLight(): void {
    applyTheme(lightHighContrastTheme);
  },

  /**
   * Returns the user's preferred colour scheme as reported by the browser.
   * Falls back to 'dark' when the media query is unavailable.
   */
  getPreferred(): 'dark' | 'light' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'dark';
  },

  /**
   * Applies whichever theme matches the user's current system preference.
   */
  applyPreferred(): void {
    const preferred = themeService.getPreferred();
    if (preferred === 'dark') {
      themeService.applyDark();
    } else {
      themeService.applyLight();
    }
  },
};
