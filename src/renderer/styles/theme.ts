/**
 * Theme - Definições centralizadas de cores, tipografia e componentes
 * Alto contraste com fundo preto (WCAG 2.2 AA)
 */

export interface ThemeColors {
  // Cores primárias
  bgPrimary: string;
  fgPrimary: string;
  accent: string;
  border: string;

  // Cores de feedback
  error: string;
  warning: string;
  success: string;
  info: string;

  // Cores secundárias
  bgSecondary: string;
  fgSecondary: string;
  bgHover: string;
  bgActive: string;
  bgDisabled: string;
  fgDisabled: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeBase: string;
  fontSizes: {
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  fontWeights: {
    normal: number;
    bold: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: {
    sm: string;
    md: string;
  };
  borderWidth: string;
  borderWidthFocus: string;
  boxShadowFocus: string;
  boxShadowError: string;
  zIndex: {
    modal: number;
    dropdown: number;
    sticky: number;
  };
}

/**
 * Tema padrão - Alto contraste com fundo preto
 */
export const darkHighContrastTheme: Theme = {
  colors: {
    bgPrimary: '#000000',
    fgPrimary: '#FFFFFF',
    accent: '#00FF00',
    border: '#888888',
    error: '#FF0000',
    warning: '#FFFF00',
    success: '#00FF00',
    info: '#00CCFF',
    bgSecondary: '#1A1A1A',
    fgSecondary: '#CCCCCC',
    bgHover: '#333333',
    bgActive: '#444444',
    bgDisabled: '#222222',
    fgDisabled: '#666666',
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: '"Courier New", Courier, monospace',
    fontSizeBase: '16px',
    fontSizes: {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
    },
    fontWeights: {
      normal: 400,
      bold: 700,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
  },
  borderWidth: '2px',
  borderWidthFocus: '3px',
  boxShadowFocus: '0 0 0 3px rgba(0, 255, 0, 0.5)',
  boxShadowError: '0 0 0 3px rgba(255, 0, 0, 0.5)',
  zIndex: {
    modal: 1000,
    dropdown: 500,
    sticky: 100,
  },
};

/**
 * Tema para modo claro (alto contraste invertido)
 */
export const lightHighContrastTheme: Theme = {
  colors: {
    bgPrimary: '#FFFFFF',
    fgPrimary: '#000000',
    accent: '#0066CC',
    border: '#777777',
    error: '#CC0000',
    warning: '#CC6600',
    success: '#006600',
    info: '#0099CC',
    bgSecondary: '#E8E8E8',
    fgSecondary: '#333333',
    bgHover: '#CCCCCC',
    bgActive: '#BBBBBB',
    bgDisabled: '#F5F5F5',
    fgDisabled: '#999999',
  },
  typography: darkHighContrastTheme.typography,
  spacing: darkHighContrastTheme.spacing,
  borderRadius: darkHighContrastTheme.borderRadius,
  borderWidth: darkHighContrastTheme.borderWidth,
  borderWidthFocus: darkHighContrastTheme.borderWidthFocus,
  boxShadowFocus: '0 0 0 3px rgba(0, 102, 204, 0.5)',
  boxShadowError: '0 0 0 3px rgba(204, 0, 0, 0.5)',
  zIndex: darkHighContrastTheme.zIndex,
};

/**
 * Retorna o tema baseado nas preferências do sistema
 */
export const getTheme = (prefersDark: boolean = true): Theme => {
  return prefersDark ? darkHighContrastTheme : lightHighContrastTheme;
};

/**
 * Aplica o tema ao documento
 */
export const applyTheme = (theme: Theme, element: HTMLElement = document.documentElement): void => {
  const style = element.style;

  // Cores
  style.setProperty('--color-bg-primary', theme.colors.bgPrimary);
  style.setProperty('--color-fg-primary', theme.colors.fgPrimary);
  style.setProperty('--color-accent', theme.colors.accent);
  style.setProperty('--color-border', theme.colors.border);
  style.setProperty('--color-error', theme.colors.error);
  style.setProperty('--color-warning', theme.colors.warning);
  style.setProperty('--color-success', theme.colors.success);
  style.setProperty('--color-info', theme.colors.info);
  style.setProperty('--color-bg-secondary', theme.colors.bgSecondary);
  style.setProperty('--color-fg-secondary', theme.colors.fgSecondary);
  style.setProperty('--color-bg-hover', theme.colors.bgHover);
  style.setProperty('--color-bg-active', theme.colors.bgActive);
  style.setProperty('--color-bg-disabled', theme.colors.bgDisabled);
  style.setProperty('--color-fg-disabled', theme.colors.fgDisabled);

  // Tipografia
  style.setProperty('--font-family-default', theme.typography.fontFamily);
  style.setProperty('--font-family-mono', theme.typography.fontFamilyMono);
  style.setProperty('--font-size-base', theme.typography.fontSizeBase);
  style.setProperty('--font-size-sm', theme.typography.fontSizes.sm);
  style.setProperty('--font-size-lg', theme.typography.fontSizes.lg);
  style.setProperty('--font-size-xl', theme.typography.fontSizes.xl);
  style.setProperty('--font-size-2xl', theme.typography.fontSizes['2xl']);

  // Espaçamento
  style.setProperty('--spacing-xs', theme.spacing.xs);
  style.setProperty('--spacing-sm', theme.spacing.sm);
  style.setProperty('--spacing-md', theme.spacing.md);
  style.setProperty('--spacing-lg', theme.spacing.lg);
  style.setProperty('--spacing-xl', theme.spacing.xl);

  // Bordas
  style.setProperty('--border-radius-sm', theme.borderRadius.sm);
  style.setProperty('--border-radius-md', theme.borderRadius.md);
  style.setProperty('--border-width', theme.borderWidth);
  style.setProperty('--border-width-focus', theme.borderWidthFocus);
  style.setProperty('--box-shadow-focus', theme.boxShadowFocus);
  style.setProperty('--box-shadow-error', theme.boxShadowError);
};
