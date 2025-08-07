/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateCSSVariables,
  applyThemeToDOM,
  mergeThemes,
  saveThemeMode,
  loadThemeMode,
} from './theme-utils';
import { Theme } from './theme.types';
import { defaultLightTheme, defaultDarkTheme } from './default-theme';

// Test fixture - minimal theme for testing
const mockTheme: Theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui'],
      serif: ['Georgia', 'serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
};

describe('theme-utils', () => {
  describe('generateCSSVariables', () => {
    it('should generate CSS variables for all color palettes', () => {
      const variables = generateCSSVariables(mockTheme);

      // Test primary color variables
      expect(variables['--color-primary-50']).toBe('#eff6ff');
      expect(variables['--color-primary-500']).toBe('#3b82f6');
      expect(variables['--color-primary-950']).toBe('#172554');

      // Test other color palettes exist
      expect(variables['--color-secondary-500']).toBe('#64748b');
      expect(variables['--color-neutral-500']).toBe('#737373');
      expect(variables['--color-success-500']).toBe('#22c55e');
      expect(variables['--color-warning-500']).toBe('#f59e0b');
      expect(variables['--color-error-500']).toBe('#ef4444');
    });

    it('should generate CSS variables for font families', () => {
      const variables = generateCSSVariables(mockTheme);

      expect(variables['--font-family-sans']).toBe('Inter, system-ui');
      expect(variables['--font-family-serif']).toBe('Georgia, serif');
      expect(variables['--font-family-mono']).toBe('JetBrains Mono, monospace');
    });

    it('should generate CSS variables for font sizes with line heights', () => {
      const variables = generateCSSVariables(mockTheme);

      expect(variables['--text-xs']).toBe('0.75rem');
      expect(variables['--leading-xs']).toBe('1.5');
      expect(variables['--text-base']).toBe('1rem');
      expect(variables['--leading-base']).toBe('1.5');
      expect(variables['--text-6xl']).toBe('3.75rem');
      expect(variables['--leading-6xl']).toBe('1.5');
    });

    it('should handle font size with complex value (array with lineHeight)', () => {
      const themeWithComplexFontSize: Theme = {
        ...mockTheme,
        typography: {
          ...mockTheme.typography!,
          fontSize: {
            ...mockTheme.typography!.fontSize!,
            lg: ['1.125rem', { lineHeight: '1.75' }] as [
              string,
              { lineHeight: string }
            ],
          },
        },
      };

      const variables = generateCSSVariables(themeWithComplexFontSize);

      expect(variables['--text-lg']).toBe('1.125rem');
      expect(variables['--leading-lg']).toBe('1.75');
    });

    it('should generate CSS variables for spacing', () => {
      const variables = generateCSSVariables(mockTheme);

      expect(variables['--spacing-xs']).toBe('0.25rem');
      expect(variables['--spacing-md']).toBe('1rem');
      expect(variables['--spacing-3xl']).toBe('4rem');
    });

    it('should generate CSS variables for border radius', () => {
      const variables = generateCSSVariables(mockTheme);

      expect(variables['--radius-none']).toBe('0');
      expect(variables['--radius-sm']).toBe('0.125rem');
      expect(variables['--radius-full']).toBe('9999px');
    });

    it('should generate CSS variables for box shadows', () => {
      const variables = generateCSSVariables(mockTheme);

      expect(variables['--shadow-sm']).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');
      expect(variables['--shadow-2xl']).toBe(
        '0 25px 50px -12px rgb(0 0 0 / 0.25)'
      );
    });

    it('should generate all expected variable keys', () => {
      const variables = generateCSSVariables(mockTheme);
      const variableKeys = Object.keys(variables);

      // Color variables (6 palettes × 11 shades = 66)
      expect(
        variableKeys.filter((key) => key.startsWith('--color-')).length
      ).toBe(66);

      // Font family variables (3)
      expect(
        variableKeys.filter((key) => key.startsWith('--font-family-')).length
      ).toBe(3);

      // Font size and line height variables (10 × 2 = 20)
      expect(
        variableKeys.filter((key) => key.startsWith('--text-')).length
      ).toBe(10);
      expect(
        variableKeys.filter((key) => key.startsWith('--leading-')).length
      ).toBe(10);

      // Spacing variables (7)
      expect(
        variableKeys.filter((key) => key.startsWith('--spacing-')).length
      ).toBe(7);

      // Border radius variables (6)
      expect(
        variableKeys.filter((key) => key.startsWith('--radius-')).length
      ).toBe(6);

      // Box shadow variables (5)
      expect(
        variableKeys.filter((key) => key.startsWith('--shadow-')).length
      ).toBe(5);
    });
  });

  describe('applyThemeToDOM', () => {
    let mockDocumentElement: {
      style: {
        setProperty: jest.Mock;
      };
    };

    beforeEach(() => {
      mockDocumentElement = {
        style: {
          setProperty: jest.fn(),
        },
      };

      // Mock document.documentElement
      Object.defineProperty(global.document, 'documentElement', {
        value: mockDocumentElement,
        writable: true,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should apply all CSS variables to document root', () => {
      applyThemeToDOM(mockTheme);

      // Should have called setProperty for each variable
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--color-primary-500',
        '#3b82f6'
      );
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--font-family-sans',
        'Inter, system-ui'
      );
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--text-base',
        '1rem'
      );
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--spacing-md',
        '1rem'
      );
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--radius-md',
        '0.375rem'
      );
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--shadow-md',
        '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      );
    });

    it('should handle SSR environment (no document)', () => {
      const originalDocument = global.document;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).document;

      // Should not throw error
      expect(() => applyThemeToDOM(mockTheme)).not.toThrow();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).document = originalDocument;
    });

    it('should call setProperty correct number of times', () => {
      applyThemeToDOM(mockTheme);

      const variables = generateCSSVariables(mockTheme);
      const expectedCallCount = Object.keys(variables).length;

      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledTimes(
        expectedCallCount
      );
    });
  });

  describe('mergeThemes', () => {
    it('should merge themes with override taking precedence', () => {
      const override = {
        colors: {
          primary: {
            500: '#ff0000', // Override primary-500
          },
        },
        spacing: {
          md: '2rem', // Override spacing-md
        },
      } as Partial<Theme>;

      const merged = mergeThemes(mockTheme, override);

      expect(merged.colors!.primary![500]).toBe('#ff0000');
      expect(merged.spacing!.md).toBe('2rem');

      // Other values should remain from base theme
      expect(merged.colors!.primary![400]).toBe('#60a5fa');
      expect(merged.spacing!.sm).toBe('0.5rem');
    });

    it('should handle partial typography override', () => {
      const override = {
        typography: {
          fontFamily: {
            sans: ['Custom Font', 'sans-serif'],
          },
        },
      } as Partial<Theme>;

      const merged = mergeThemes(mockTheme, override);

      expect(merged.typography!.fontFamily!.sans).toEqual([
        'Custom Font',
        'sans-serif',
      ]);
      expect(merged.typography!.fontFamily!.serif).toEqual([
        'Georgia',
        'serif',
      ]); // Unchanged
      expect(merged.typography!.fontSize!.base).toBe('1rem'); // Unchanged
    });

    it('should handle empty override', () => {
      const merged = mergeThemes(mockTheme, {});

      expect(merged).toEqual(mockTheme);
    });

    it('should handle deep partial overrides', () => {
      const override = {
        colors: {
          primary: {
            500: '#custom',
          },
        },
        typography: {
          fontSize: {
            base: '1.2rem',
          },
        },
      } as Partial<Theme>;

      const merged = mergeThemes(mockTheme, override);

      expect(merged.colors!.primary![500]).toBe('#custom');
      expect(merged.colors!.primary![400]).toBe('#60a5fa'); // Unchanged
      expect(merged.typography!.fontSize!.base).toBe('1.2rem');
      expect(merged.typography!.fontSize!.sm).toBe('0.875rem'); // Unchanged
    });
  });

  describe('localStorage utilities', () => {
    let mockLocalStorage: {
      getItem: jest.Mock;
      setItem: jest.Mock;
    };

    beforeEach(() => {
      mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
      };

      Object.defineProperty(global.window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('saveThemeMode', () => {
      it('should save light mode to localStorage', () => {
        saveThemeMode('light');

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'theme-mode',
          'light'
        );
      });

      it('should save dark mode to localStorage', () => {
        saveThemeMode('dark');

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'theme-mode',
          'dark'
        );
      });

      it('should handle SSR environment (no window)', () => {
        const originalWindow = global.window;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (global as any).window;

        expect(() => saveThemeMode('light')).not.toThrow();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).window = originalWindow;
      });
    });

    describe('loadThemeMode', () => {
      it('should load light mode from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('light');

        const result = loadThemeMode();

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme-mode');
        expect(result).toBe('light');
      });

      it('should load dark mode from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('dark');

        const result = loadThemeMode();

        expect(result).toBe('dark');
      });

      it('should return null for invalid values', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid');

        const result = loadThemeMode();

        expect(result).toBe(null);
      });

      it('should return null when no value exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = loadThemeMode();

        expect(result).toBe(null);
      });

      it('should handle SSR environment (no window)', () => {
        const originalWindow = global.window;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (global as any).window;

        const result = loadThemeMode();

        expect(result).toBe(null);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).window = originalWindow;
      });
    });
  });

  describe('integration with default themes', () => {
    it('should work with defaultLightTheme', () => {
      const variables = generateCSSVariables(defaultLightTheme);

      expect(variables['--color-primary-500']).toBe('#3b82f6');
      expect(variables['--color-neutral-500']).toBe('#737373');
    });

    it('should work with defaultDarkTheme', () => {
      const variables = generateCSSVariables(defaultDarkTheme);

      expect(variables['--color-primary-500']).toBe('#3b82f6');
      expect(variables['--color-neutral-500']).toBe('#737373'); // Dark theme inverts neutrals
    });

    it('should merge light and dark themes correctly', () => {
      const merged = mergeThemes(defaultLightTheme, {
        colors: defaultDarkTheme.colors,
      } as Partial<Theme>);

      expect(merged.colors!.neutral![500]).toBe('#737373'); // From dark theme
      expect(merged.typography!.fontFamily!.sans).toEqual([
        'Inter',
        'system-ui',
        'sans-serif',
      ]); // From light theme
    });
  });
});
