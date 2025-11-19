import { themeQuartz } from '../datagrid.types';
import { DataGridThemeAdapter } from './theme.adapter';
import type { UITheme } from './theme.types';

describe('DataGridThemeAdapter', () => {
  describe('default behavior', () => {
    it('should return AG Grid default theme when no theme provided', () => {
      const result = DataGridThemeAdapter.adapt(undefined);
      expect(result).toBe(themeQuartz);

      // Also test with mode specified
      const resultWithMode = DataGridThemeAdapter.adapt(undefined, 'light');
      expect(resultWithMode).toBe(themeQuartz);
    });
  });

  describe('UI-Theme adaptation', () => {
    it('should adapt a minimal UI-Theme with primary color', () => {
      const theme: UITheme = {
        colors: {
          primary: {
            '500': '#007bff',
          },
        },
      };

      const result = DataGridThemeAdapter.adapt(theme);
      expect(result).toBeDefined();
      expect(result).not.toBe(themeQuartz);
    });

    it('should adapt UI-Theme with complete color palette', () => {
      const theme: UITheme = {
        colors: {
          primary: {
            '400': '#66a3ff',
            '500': '#007bff',
            '600': '#0056b3',
          },
          success: {
            '500': '#28a745',
          },
          warning: {
            '500': '#ffc107',
          },
          error: {
            '500': '#dc3545',
          },
        },
      };

      const result = DataGridThemeAdapter.adapt(theme);
      expect(result).toBeDefined();
      expect(result).not.toBe(themeQuartz);
    });

    it('should handle UI-Theme with typography but no colors', () => {
      const theme: UITheme = {
        typography: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
          },
          fontSize: {
            base: '14px',
          },
        },
      };

      // With typography, should return modified theme
      const result = DataGridThemeAdapter.adapt(theme);
      expect(result).toBeDefined();
      // Now processes typography, so returns modified theme
      expect(result).not.toBe(themeQuartz);
    });

    it('should handle both light and dark modes with UI-Theme', () => {
      const theme: UITheme = {
        colors: {
          primary: {
            '500': '#007bff',
          },
        },
      };

      // Test light mode
      const lightResult = DataGridThemeAdapter.adapt(theme, 'light');
      expect(lightResult).toBeDefined();
      expect(lightResult).not.toBe(themeQuartz);

      // Test dark mode
      const darkResult = DataGridThemeAdapter.adapt(theme, 'dark');
      expect(darkResult).toBeDefined();
      expect(darkResult).not.toBe(themeQuartz);
    });

    it('should handle empty UI-Theme object', () => {
      const theme: UITheme = {};

      // Empty theme (no colors) returns base theme
      const result = DataGridThemeAdapter.adapt(theme);
      expect(result).toBeDefined();
      expect(result).toBe(themeQuartz);
    });

    it('should handle UI-Theme with non-500 color shades', () => {
      // Test with 600 shade
      const theme600: UITheme = {
        colors: {
          primary: {
            '600': '#0056b3', // Only 600, adapter looks for 500
          },
        },
      };
      const result600 = DataGridThemeAdapter.adapt(theme600);
      expect(result600).toBeDefined();
      expect(result600).not.toBe(themeQuartz);

      // Test with 400 shade
      const theme400: UITheme = {
        colors: {
          primary: {
            '400': '#66a3ff', // Only 400, adapter looks for 500
          },
        },
      };
      const result400 = DataGridThemeAdapter.adapt(theme400);
      expect(result400).toBeDefined();
      expect(result400).not.toBe(themeQuartz);
    });

    it('should handle UI-Theme with typography fontSize in rem', () => {
      const theme: UITheme = {
        typography: {
          fontSize: {
            base: '1rem', // Should convert to 16px
          },
        },
      };

      const result = DataGridThemeAdapter.adapt(theme);
      expect(result).toBeDefined();
      expect(result).not.toBe(themeQuartz);
    });
  });
});
