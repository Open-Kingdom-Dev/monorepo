export interface ColorPalette {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
  950?: string;
}

export interface TypographyScale {
  xs?: string | [string, { lineHeight: string }];
  sm?: string | [string, { lineHeight: string }];
  base?: string | [string, { lineHeight: string }];
  lg?: string | [string, { lineHeight: string }];
  xl?: string | [string, { lineHeight: string }];
  '2xl'?: string | [string, { lineHeight: string }];
  '3xl'?: string | [string, { lineHeight: string }];
  '4xl'?: string | [string, { lineHeight: string }];
  '5xl'?: string | [string, { lineHeight: string }];
  '6xl'?: string | [string, { lineHeight: string }];
}

export interface SpacingScale {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  '3xl'?: string;
}

export interface BorderRadiusScale {
  none?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  full?: string;
}

export interface ShadowScale {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

export interface FontFamily {
  sans?: string[];
  serif?: string[];
  mono?: string[];
}

export interface ThemeColors {
  primary?: ColorPalette;
  secondary?: ColorPalette;
  neutral?: ColorPalette;
  success?: ColorPalette;
  warning?: ColorPalette;
  error?: ColorPalette;
}

export interface Theme {
  colors?: ThemeColors;
  typography?: {
    fontFamily?: FontFamily;
    fontSize?: TypographyScale;
  };
  spacing?: SpacingScale;
  borderRadius?: BorderRadiusScale;
  boxShadow?: ShadowScale;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: Partial<Theme>) => void;
}
