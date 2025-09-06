import { Theme } from './theme.types';

export const generateCSSVariables = (theme: Theme): Record<string, string> => {
  const variables: Record<string, string> = {};

  // Generate color variables
  Object.entries(theme.colors || {}).forEach(([colorName, colorPalette]) => {
    Object.entries(colorPalette).forEach(([shade, value]) => {
      variables[`--color-${colorName}-${shade}`] = value as string;
    });
  });

  // Generate typography variables
  Object.entries(theme.typography?.fontFamily || {}).forEach(
    ([family, fonts]) => {
      variables[`--font-family-${family}`] = fonts.join(', ');
    }
  );

  Object.entries(theme.typography?.fontSize || {}).forEach(([size, value]) => {
    if (typeof value === 'string') {
      variables[`--text-${size}`] = value;
      variables[`--leading-${size}`] = '1.5';
    } else {
      variables[`--text-${size}`] = value[0];
      variables[`--leading-${size}`] = value[1].lineHeight;
    }
  });

  // Generate spacing variables
  Object.entries(theme.spacing || {}).forEach(([size, value]) => {
    variables[`--spacing-${size}`] = value;
  });

  // Generate border radius variables
  Object.entries(theme.borderRadius || {}).forEach(([size, value]) => {
    variables[`--radius-${size}`] = value;
  });

  // Generate box shadow variables
  Object.entries(theme.boxShadow || {}).forEach(([size, value]) => {
    variables[`--shadow-${size}`] = value;
  });

  return variables;
};

export const applyThemeToDOM = (theme: Theme): void => {
  if (typeof document === 'undefined') return;

  const variables = generateCSSVariables(theme);
  const root = document.documentElement;

  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

export const mergeThemes = (
  baseTheme: Theme,
  overrideTheme: Partial<Theme>
): Theme => {
  return {
    ...baseTheme,
    ...overrideTheme,
    colors: {
      primary: {
        ...baseTheme?.colors?.primary,
        ...overrideTheme?.colors?.primary,
      },
      secondary: {
        ...baseTheme?.colors?.secondary,
        ...overrideTheme?.colors?.secondary,
      },
      neutral: {
        ...baseTheme?.colors?.neutral,
        ...overrideTheme?.colors?.neutral,
      },
      success: {
        ...baseTheme?.colors?.success,
        ...overrideTheme?.colors?.success,
      },
      warning: {
        ...baseTheme?.colors?.warning,
        ...overrideTheme?.colors?.warning,
      },
      error: { ...baseTheme?.colors?.error, ...overrideTheme?.colors?.error },
    },
    typography: {
      ...baseTheme.typography,
      ...overrideTheme.typography,
      fontFamily: {
        ...baseTheme?.typography?.fontFamily,
        ...overrideTheme.typography?.fontFamily,
      },
      fontSize: {
        ...baseTheme?.typography?.fontSize,
        ...overrideTheme.typography?.fontSize,
      },
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrideTheme.spacing,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...overrideTheme.borderRadius,
    },
    boxShadow: {
      ...baseTheme.boxShadow,
      ...overrideTheme.boxShadow,
    },
  };
};

export const saveThemeMode = (mode: 'light' | 'dark'): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme-mode', mode);
  }
};

export const loadThemeMode = (): 'light' | 'dark' | null => {
  if (typeof window === 'undefined') return null;

  const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark';
  return savedMode && (savedMode === 'light' || savedMode === 'dark')
    ? savedMode
    : null;
};
