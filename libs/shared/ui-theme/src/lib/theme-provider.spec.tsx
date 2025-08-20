import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme-provider';
import { generateCSSVariables, mergeThemes } from './theme-utils';
import { defaultLightTheme } from './default-theme';
import {
  mockDocumentElement,
  mockLocalStorage,
  createMockTheme,
  themeAssertions,
  testScenarios,
  performanceHelpers,
} from './test-utils';
import { Theme } from './theme.types';

/**
 * Integration tests for the complete theme system
 * These tests verify that all components work together correctly
 */

// Complex test component that uses multiple theme features
const FullThemeTestComponent: React.FC = () => {
  const { theme, mode, setMode, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="primary-500">{theme?.colors?.primary?.[500]}</div>
      <div data-testid="neutral-900">{theme?.colors?.neutral?.[900]}</div>
      <div data-testid="font-sans">
        {theme?.typography?.fontFamily?.sans?.join(', ')}
      </div>
      <div data-testid="text-base">
        {typeof theme?.typography?.fontSize?.base === 'string'
          ? theme.typography.fontSize.base
          : theme?.typography?.fontSize?.base?.[0]}
      </div>
      <div data-testid="spacing-md">{theme?.spacing?.md}</div>
      <div data-testid="radius-lg">{theme?.borderRadius?.lg}</div>
      <div data-testid="shadow-md">{theme?.boxShadow?.md}</div>

      <button
        data-testid="switch-mode"
        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
      >
        Switch Mode
      </button>

      <button
        data-testid="custom-primary"
        onClick={() =>
          setTheme({
            colors: {
              ...theme?.colors,
              primary: {
                ...theme?.colors?.primary,
                500: '#ff0000',
              },
            },
          })
        }
      >
        Custom Primary
      </button>

      <button
        data-testid="custom-spacing"
        onClick={() =>
          setTheme({
            spacing: {
              ...theme?.spacing,
              md: '2rem',
            },
          })
        }
      >
        Custom Spacing
      </button>
    </div>
  );
};

describe('Theme System Integration', () => {
  let mockDOM: ReturnType<typeof mockDocumentElement>;
  let mockStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    mockDOM = mockDocumentElement();
    mockStorage = mockLocalStorage();
  });

  afterEach(() => {
    mockDOM.cleanup();
    mockStorage.cleanup();
  });

  describe('complete theme flow', () => {
    it('should initialize, apply theme, and handle mode switching', async () => {
      render(
        <ThemeProvider>
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      // Initial state should be light mode
      expect(screen.getByTestId('mode')).toHaveTextContent('light');
      expect(screen.getByTestId('primary-500')).toHaveTextContent('#3b82f6');
      expect(screen.getByTestId('neutral-900')).toHaveTextContent('#171717');

      // DOM should have been updated with light theme
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--color-primary-500',
        '#3b82f6'
      );
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--color-neutral-900',
        '#171717'
      );

      fireEvent.click(screen.getByTestId('switch-mode'));

      // UI should update to dark mode
      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('neutral-900')).toHaveTextContent('#f5f5f5'); // Dark theme inverts neutrals

      // DOM should be updated with dark theme
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--color-neutral-900',
        '#f5f5f5'
      );

      // localStorage should save the preference
      expect(mockStorage.setItem).toHaveBeenCalledWith('theme-mode', 'dark');
    });

    it('should handle custom theme changes while preserving mode', () => {
      render(
        <ThemeProvider>
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      // Apply custom primary color
      fireEvent.click(screen.getByTestId('custom-primary'));

      expect(screen.getByTestId('primary-500')).toHaveTextContent('#ff0000');
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--color-primary-500',
        '#ff0000'
      );

      // Other colors should remain unchanged
      expect(screen.getByTestId('neutral-900')).toHaveTextContent('#171717');

      // Mode should still be light
      expect(screen.getByTestId('mode')).toHaveTextContent('light');
    });

    it('should handle multiple custom theme changes', () => {
      render(
        <ThemeProvider>
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      // Apply multiple custom changes
      fireEvent.click(screen.getByTestId('custom-primary'));
      fireEvent.click(screen.getByTestId('custom-spacing'));

      expect(screen.getByTestId('primary-500')).toHaveTextContent('#ff0000');
      expect(screen.getByTestId('spacing-md')).toHaveTextContent('2rem');

      // DOM should reflect both changes
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--color-primary-500',
        '#ff0000'
      );
      expect(mockDOM.setProperty).toHaveBeenCalledWith('--spacing-md', '2rem');
    });

    it('should persist and restore theme mode on page reload', () => {
      // Simulate saved dark mode
      mockStorage.store['theme-mode'] = 'dark';
      mockStorage.getItem.mockImplementation(
        (key) => mockStorage.store[key] || null
      );

      render(
        <ThemeProvider>
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      // Should initialize with saved dark mode
      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(mockStorage.getItem).toHaveBeenCalledWith('theme-mode');
    });
  });

  describe('theme merging and CSS variable generation integration', () => {
    it('should correctly merge themes and generate CSS variables', () => {
      const customTheme = createMockTheme({
        colors: {
          primary: {
            50: '#custom50',
            100: '#custom100',
            200: '#custom200',
            300: '#custom300',
            400: '#custom400',
            500: '#custom500',
            600: '#custom600',
            700: '#custom700',
            800: '#custom800',
            900: '#custom900',
            950: '#custom950',
          },
        },
        spacing: {
          md: '2rem',
        },
      });

      const mergedTheme = mergeThemes(defaultLightTheme, customTheme);
      const variables = generateCSSVariables(mergedTheme);

      // Custom values should be present
      expect(variables['--color-primary-500']).toBe('#custom500');
      expect(variables['--spacing-md']).toBe('2rem');

      // Non-overridden values should remain from base theme
      expect(variables['--color-secondary-500']).toBe(
        defaultLightTheme?.colors?.secondary?.[500]
      );
      expect(variables['--spacing-sm']).toBe(defaultLightTheme?.spacing?.sm);

      // All variable types should be present
      themeAssertions.hasAllCSSVariables(variables);
    });

    it('should handle complex theme overrides correctly', () => {
      const complexOverride: Partial<Theme> = {
        colors: {
          primary: {
            500: '#red',
          },
          neutral: {
            100: '#lightgray',
            900: '#darkgray',
          },
        },
        typography: {
          fontFamily: {
            sans: ['Custom', 'Arial'],
          },
          fontSize: {
            base: '1.2rem',
            lg: '1.8rem',
          },
        },
        spacing: {
          md: '1.5rem',
          xl: '3rem',
        },
        borderRadius: {
          lg: '1rem',
        },
        boxShadow: {
          md: 'custom shadow',
        },
      };

      const mergedTheme = mergeThemes(defaultLightTheme, complexOverride);
      const variables = generateCSSVariables(mergedTheme);

      // All overrides should be applied
      expect(variables['--color-primary-500']).toBe('#red');
      expect(variables['--color-neutral-100']).toBe('#lightgray');
      expect(variables['--color-neutral-900']).toBe('#darkgray');
      expect(variables['--font-family-sans']).toBe('Custom, Arial');
      expect(variables['--text-base']).toBe('1.2rem');
      expect(variables['--text-lg']).toBe('1.8rem');
      expect(variables['--spacing-md']).toBe('1.5rem');
      expect(variables['--spacing-xl']).toBe('3rem');
      expect(variables['--radius-lg']).toBe('1rem');
      expect(variables['--shadow-md']).toBe('custom shadow');

      // Non-overridden values should remain
      expect(variables['--color-primary-400']).toBe(
        defaultLightTheme?.colors?.primary?.[400]
      );
      expect(variables['--color-secondary-500']).toBe(
        defaultLightTheme?.colors?.secondary?.[500]
      );
      expect(variables['--spacing-sm']).toBe(defaultLightTheme?.spacing?.sm);
    });
  });

  describe('performance integration', () => {
    it('should apply theme changes efficiently', async () => {
      render(
        <ThemeProvider>
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      const performanceResults = performanceHelpers.stressTestThemeSwitching(
        () => {
          fireEvent.click(screen.getByTestId('switch-mode'));
        },
        10
      ); // Reduced iterations for test performance

      // Theme switching should be reasonably fast
      expect(performanceResults.average).toBeLessThan(50); // 50ms average
      expect(performanceResults.max).toBeLessThan(200); // 200ms max
    });

    it('should not cause memory leaks with rapid theme changes', () => {
      render(
        <ThemeProvider>
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      // Rapidly change themes
      for (let i = 0; i < 20; i++) {
        fireEvent.click(screen.getByTestId('custom-primary'));
        fireEvent.click(screen.getByTestId('custom-spacing'));
        fireEvent.click(screen.getByTestId('switch-mode'));
      }

      // Should still be responsive
      expect(screen.getByTestId('mode')).toBeInTheDocument();
      expect(screen.getByTestId('primary-500')).toBeInTheDocument();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle malformed localStorage data gracefully', () => {
      mockStorage.getItem.mockReturnValue('invalid-mode');

      render(
        <ThemeProvider initialMode="light">
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      // Should fall back to initial mode
      expect(screen.getByTestId('mode')).toHaveTextContent('light');
    });

    it('should handle SSR environment', () => {
      const originalDocument = global.document;
      const originalWindow = global.window;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).document;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      expect(() => {
        render(
          <ThemeProvider>
            <FullThemeTestComponent />
          </ThemeProvider>
        );
      }).not.toThrow();

      global.document = originalDocument;
      global.window = originalWindow;
    });

    it('should handle theme with missing properties gracefully', () => {
      const incompleteTheme = {
        colors: {
          primary: {
            500: '#test',
          },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      expect(() => {
        const variables = generateCSSVariables(incompleteTheme);
        expect(variables['--color-primary-500']).toBe('#test');
      }).not.toThrow();
    });
  });

  describe('scenario testing', () => {
    testScenarios.themeOverrides.forEach(({ name, override }) => {
      it(`should handle ${name} correctly`, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mergedTheme = mergeThemes(defaultLightTheme, override as any);
        const variables = generateCSSVariables(mergedTheme);

        expect(variables).toBeDefined();
        expect(Object.keys(variables).length).toBeGreaterThan(0);

        // Should have all required variable types
        themeAssertions.hasAllCSSVariables(variables);
      });
    });

    testScenarios.edgeCases.forEach(({ name, override }) => {
      it(`should handle edge case: ${name}`, () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mergedTheme = mergeThemes(defaultLightTheme, override as any);
          const variables = generateCSSVariables(mergedTheme);
          expect(variables).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('real-world usage patterns', () => {
    it('should support custom brand theming', () => {
      const brandTheme: Partial<Theme> = {
        colors: {
          primary: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444', // Brand red
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
            950: '#450a0a',
          },
        },
        typography: {
          fontFamily: {
            sans: ['Brand Font', 'Helvetica', 'Arial', 'sans-serif'],
          },
        },
        spacing: {
          md: '1.25rem', // Custom base spacing
        },
      };

      render(
        <ThemeProvider
          initialTheme={mergeThemes(defaultLightTheme, brandTheme)}
        >
          <FullThemeTestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary-500')).toHaveTextContent('#ef4444');
      expect(screen.getByTestId('font-sans')).toHaveTextContent(
        'Brand Font, Helvetica, Arial, sans-serif'
      );
      expect(screen.getByTestId('spacing-md')).toHaveTextContent('1.25rem');

      // Should apply brand colors to DOM
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--color-primary-500',
        '#ef4444'
      );
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--font-family-sans',
        'Brand Font, Helvetica, Arial, sans-serif'
      );
      expect(mockDOM.setProperty).toHaveBeenCalledWith(
        '--spacing-md',
        '1.25rem'
      );
    });
  });
});
