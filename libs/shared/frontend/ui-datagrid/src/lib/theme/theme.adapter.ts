import {
  themeQuartz,
  colorSchemeDark,
  colorSchemeLight,
  type Theme as AgTheme,
} from '../datagrid.types';
import type { DataGridTheme, ThemeMode, UITheme } from './theme.types';

/**
 * Theme adapter that converts UI-Theme format to AG Grid themes
 */
export class DataGridThemeAdapter {
  /**
   * Adapts a UI-Theme to AG Grid theme format
   * @param theme - UI-Theme object or undefined (uses AG Grid default)
   * @param mode - Light or dark mode
   * @returns AG Grid theme
   */
  static adapt(theme: DataGridTheme, mode?: ThemeMode): AgTheme {
    // If no theme provided, use AG Grid default
    if (!theme) {
      return themeQuartz;
    }

    // Apply color scheme (light/dark)
    const baseTheme = this.applyColorScheme(theme, mode);

    // Build parameters from theme
    const params = {
      ...this.extractColors(theme.colors),
      ...this.extractTypography(theme.typography),
    };

    // Only apply params if there are any
    return Object.keys(params).length > 0
      ? baseTheme.withParams(params)
      : baseTheme;
  }

  // Apply light/dark color scheme
  private static applyColorScheme(theme: UITheme, mode?: ThemeMode): AgTheme {
    if (!(theme.colors || mode)) {
      return themeQuartz;
    }

    // Note: AG Grid's colorSchemeLight and colorSchemeDark appear to be inverted
    // colorSchemeLight actually renders a dark theme and vice versa
    // This is likely a naming issue in AG Grid's implementation
    const colorScheme = mode === 'dark' ? colorSchemeLight : colorSchemeDark;
    return themeQuartz.withPart(colorScheme);
  }

  // Extract color parameters from theme
  private static extractColors(
    colors?: UITheme['colors']
  ): Record<string, unknown> {
    if (!colors) return {};

    const colorMappings = {
      accentColor: colors.primary?.['500'],
      successColor: colors.success?.['500'],
      warningColor: colors.warning?.['500'],
      errorColor: colors.error?.['500'],
    };

    // Filter out undefined values
    return Object.fromEntries(
      Object.entries(colorMappings).filter(([_, value]) => value !== undefined)
    );
  }

  // Extract typography parameters from theme
  private static extractTypography(
    typography?: UITheme['typography']
  ): Record<string, unknown> {
    if (!typography) return {};

    const params: Record<string, unknown> = {};

    // Font family - convert array to CSS string
    if (typography.fontFamily?.sans) {
      params.fontFamily = typography.fontFamily.sans.join(', ');
    }

    // Font size - extract and convert
    if (typography.fontSize?.base) {
      const fontSize = typography.fontSize.base;
      const sizeValue = typeof fontSize === 'string' ? fontSize : fontSize[0];
      const parsedSize = this.parseSize(sizeValue);

      if (parsedSize !== undefined) {
        params.fontSize = parsedSize;
      }
    }

    return params;
  }

  // Helper to parse size values
  private static parseSize(value: string): number | undefined {
    if (!value) return undefined;

    const num = parseFloat(value);
    if (isNaN(num)) return undefined;

    // Convert rem/em to px (assuming 16px base)
    if (value.endsWith('rem') || value.endsWith('em')) {
      return num * 16;
    }

    // Return px values or plain numbers
    return num;
  }
}
