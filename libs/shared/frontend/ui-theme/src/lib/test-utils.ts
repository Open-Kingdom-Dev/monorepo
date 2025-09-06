import { Theme, ColorPalette } from './theme.types';

/**
 * Creates a minimal theme for testing purposes
 */
export const createMockTheme = (overrides: Partial<Theme> = {}): Theme => {
  const mockColorPalette: ColorPalette = {
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
  };

  const baseTheme: Theme = {
    colors: {
      primary: mockColorPalette,
      secondary: mockColorPalette,
      neutral: mockColorPalette,
      success: mockColorPalette,
      warning: mockColorPalette,
      error: mockColorPalette,
    },
    typography: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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

  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme?.colors,
      ...overrides.colors,
    },
    typography: {
      ...baseTheme?.typography,
      ...overrides.typography,
      fontFamily: {
        ...baseTheme.typography?.fontFamily,
        ...overrides.typography?.fontFamily,
      },
      fontSize: {
        ...baseTheme.typography?.fontSize,
        ...overrides.typography?.fontSize,
      },
    },
    spacing: {
      ...baseTheme?.spacing,
      ...overrides.spacing,
    },
    borderRadius: {
      ...baseTheme?.borderRadius,
      ...overrides.borderRadius,
    },
    boxShadow: {
      ...baseTheme?.boxShadow,
      ...overrides.boxShadow,
    },
  };
};

/**
 * Creates a custom color palette for testing
 */
export const createMockColorPalette = (
  baseColor = '#3b82f6'
): ColorPalette => ({
  50: `${baseColor}10`,
  100: `${baseColor}20`,
  200: `${baseColor}30`,
  300: `${baseColor}40`,
  400: `${baseColor}50`,
  500: baseColor,
  600: `${baseColor}60`,
  700: `${baseColor}70`,
  800: `${baseColor}80`,
  900: `${baseColor}90`,
  950: `${baseColor}95`,
});

/**
 * Mock DOM utilities for testing
 */
export const mockDocumentElement = () => {
  const setProperty = jest.fn();
  const getPropertyValue = jest.fn();

  const mockStyle = {
    setProperty,
    getPropertyValue,
  };

  const mockElement = {
    style: mockStyle,
  };

  // Mock document.documentElement
  Object.defineProperty(document, 'documentElement', {
    value: mockElement,
    writable: true,
    configurable: true,
  });

  return {
    setProperty,
    getPropertyValue,
    cleanup: () => {
      setProperty.mockClear();
      getPropertyValue.mockClear();
    },
  };
};

/**
 * Mock localStorage utilities for testing
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  const getItem = jest.fn((key: string) => store[key] || null);
  const setItem = jest.fn((key: string, value: string) => {
    store[key] = value;
  });
  const removeItem = jest.fn((key: string) => {
    delete store[key];
  });
  const clear = jest.fn(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  });

  const mockStorage = {
    getItem,
    setItem,
    removeItem,
    clear,
    length: 0,
    key: jest.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    store,
    cleanup: () => {
      getItem.mockClear();
      setItem.mockClear();
      removeItem.mockClear();
      clear.mockClear();
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

/**
 * Test helper to count CSS variable types
 */
export const countCSSVariableTypes = (variables: Record<string, string>) => {
  const counts = {
    colors: 0,
    fontFamily: 0,
    fontSize: 0,
    lineHeight: 0,
    spacing: 0,
    borderRadius: 0,
    boxShadow: 0,
    total: 0,
  };

  Object.keys(variables).forEach((key) => {
    if (key.startsWith('--color-')) counts.colors++;
    else if (key.startsWith('--font-family-')) counts.fontFamily++;
    else if (key.startsWith('--text-')) counts.fontSize++;
    else if (key.startsWith('--leading-')) counts.lineHeight++;
    else if (key.startsWith('--spacing-')) counts.spacing++;
    else if (key.startsWith('--radius-')) counts.borderRadius++;
    else if (key.startsWith('--shadow-')) counts.boxShadow++;

    counts.total++;
  });

  return counts;
};

/**
 * Assertion helpers for theme testing
 */
export const themeAssertions = {
  /**
   * Assert that all expected CSS variables are present
   */
  hasAllCSSVariables: (variables: Record<string, string>) => {
    const counts = countCSSVariableTypes(variables);

    expect(counts.colors).toBeGreaterThan(0);
    expect(counts.fontFamily).toBeGreaterThan(0);
    expect(counts.fontSize).toBeGreaterThan(0);
    expect(counts.lineHeight).toBeGreaterThan(0);
    expect(counts.spacing).toBeGreaterThan(0);
    expect(counts.borderRadius).toBeGreaterThan(0);
    expect(counts.boxShadow).toBeGreaterThan(0);
  },

  /**
   * Assert that CSS variable follows naming convention
   */
  hasValidCSSVariableName: (name: string) => {
    expect(name).toMatch(/^--[a-z]+(-[a-z0-9]+)*$/);
  },

  /**
   * Assert that theme has required structure
   */
  hasValidThemeStructure: (theme: Theme) => {
    expect(theme).toHaveProperty('colors');
    expect(theme).toHaveProperty('typography');
    expect(theme).toHaveProperty('spacing');
    expect(theme).toHaveProperty('borderRadius');
    expect(theme).toHaveProperty('boxShadow');

    expect(theme.colors).toHaveProperty('primary');
    expect(theme.colors).toHaveProperty('secondary');
    expect(theme.colors).toHaveProperty('neutral');
    expect(theme.colors).toHaveProperty('success');
    expect(theme.colors).toHaveProperty('warning');
    expect(theme.colors).toHaveProperty('error');

    expect(theme.typography).toHaveProperty('fontFamily');
    expect(theme.typography).toHaveProperty('fontSize');
  },
};

/**
 * Test scenarios for theme testing
 */
export const testScenarios = {
  /**
   * Common theme override scenarios
   */
  themeOverrides: [
    {
      name: 'primary color override',
      override: {
        colors: {
          primary: createMockColorPalette('#ff0000'),
        },
      },
    },
    {
      name: 'spacing override',
      override: {
        spacing: {
          md: '2rem',
          lg: '3rem',
        },
      },
    },
    {
      name: 'typography override',
      override: {
        typography: {
          fontFamily: {
            sans: ['Custom Font', 'sans-serif'],
          },
          fontSize: {
            base: '1.2rem',
          },
        },
      },
    },
    {
      name: 'border radius override',
      override: {
        borderRadius: {
          md: '1rem',
          lg: '2rem',
        },
      },
    },
  ],

  /**
   * Edge case scenarios
   */
  edgeCases: [
    {
      name: 'empty theme override',
      override: {},
    },
    {
      name: 'partial color palette',
      override: {
        colors: {
          primary: {
            500: '#custom',
          } as Partial<ColorPalette>,
        },
      },
    },
    {
      name: 'null values',
      override: {
        spacing: {
          // Setting up for testing purposes
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          md: null as any,
        },
      },
    },
  ],
};

/**
 * Performance testing utilities
 */
export const performanceHelpers = {
  /**
   * Measure time for theme application
   */
  measureThemeApplicationTime: async (fn: () => void): Promise<number> => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },

  /**
   * Stress test theme switching
   */
  stressTestThemeSwitching: (switchFn: () => void, iterations = 100) => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      switchFn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((a, b) => a + b, 0),
    };
  },
};
