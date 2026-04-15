import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMountEffect, useUpdateEffect } from '@react-hookz/web';
import { Theme, ThemeContextValue, ThemeMode } from './theme.types';
import { defaultLightTheme, defaultDarkTheme } from './default-theme';
import {
  applyThemeToDOM,
  loadThemeMode,
  mergeThemes,
  saveThemeMode,
} from './theme-utils';

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
  initialTheme?: Partial<Theme>;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme,
  initialMode = 'light',
}) => {
  const [theme, setThemeState] = useState<Theme>(
    initialTheme
      ? mergeThemes(defaultLightTheme, initialTheme)
      : defaultLightTheme
  );
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  useUpdateEffect(() => {
    if (!initialTheme) {
      const newTheme = mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
      setThemeState(newTheme);
    }
  }, [mode, initialTheme]);

  useMountEffect(() => {
    const savedMode = loadThemeMode();
    if (savedMode) {
      setModeState(savedMode);
    }
  });

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    saveThemeMode(newMode);
  };

  const setTheme = (newTheme: Partial<Theme>) => {
    setThemeState((prev) => mergeThemes(prev, newTheme));
  };

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
