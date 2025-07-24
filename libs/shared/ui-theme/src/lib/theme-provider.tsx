import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeContextValue, ThemeMode } from './theme.types';
import { defaultLightTheme, defaultDarkTheme } from './default-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = defaultLightTheme,
  initialMode = 'light',
}) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  // Apply theme to CSS custom properties
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Apply colors
    Object.entries(theme.colors).forEach(([colorName, colorPalette]) => {
      Object.entries(colorPalette).forEach(([shade, value]) => {
        root.style.setProperty(`--color-${colorName}-${shade}`, value);
      });
    });

    // Apply typography
    Object.entries(theme.typography.fontFamily).forEach(([family, fonts]) => {
      root.style.setProperty(`--font-family-${family}`, fonts.join(', '));
    });

    Object.entries(theme.typography.fontSize).forEach(([size, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--text-${size}`, value);
        root.style.setProperty(`--leading-${size}`, '1.5');
      } else {
        root.style.setProperty(`--text-${size}`, value[0]);
        root.style.setProperty(`--leading-${size}`, value[1].lineHeight);
      }
    });

    // Apply spacing
    Object.entries(theme.spacing).forEach(([size, value]) => {
      root.style.setProperty(`--spacing-${size}`, value);
    });

    // Apply border radius
    Object.entries(theme.borderRadius).forEach(([size, value]) => {
      root.style.setProperty(`--radius-${size}`, value);
    });

    // Apply box shadows
    Object.entries(theme.boxShadow).forEach(([size, value]) => {
      root.style.setProperty(`--shadow-${size}`, value);
    });
  }, [theme]);

  // Handle mode changes
  useEffect(() => {
    const newTheme = mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
    setThemeState(newTheme);
  }, [mode]);

  // Load saved theme mode from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', newMode);
    }
  };

  const setTheme = (newTheme: Partial<Theme>) => {
    setThemeState(prev => ({ ...prev, ...newTheme }));
  };

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}; 