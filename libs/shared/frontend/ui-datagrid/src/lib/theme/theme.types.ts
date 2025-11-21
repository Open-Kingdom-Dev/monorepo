export type ThemeMode = 'light' | 'dark';

/**
 * Theme structure for DataGrid - subset of UI-Theme library
 * Only includes properties that can be mapped to AG Grid theme parameters
 */
export interface UITheme {
  colors?: {
    primary?: Record<string, string>;
    success?: Record<string, string>;
    warning?: Record<string, string>;
    error?: Record<string, string>;
  };
  typography?: {
    fontFamily?: {
      sans?: string[];
    };
    fontSize?: Record<string, string | [string, { lineHeight: string }]>;
  };
}

// DataGrid accepts either a UI-Theme or undefined (uses AG Grid default)
export type DataGridTheme = UITheme | undefined;
