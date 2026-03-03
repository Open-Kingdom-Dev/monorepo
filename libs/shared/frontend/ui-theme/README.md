# @open-kingdom/shared-frontend-ui-theme

Centralized theming system providing a `Theme` object structure, CSS custom property generation applied to `document.documentElement`, a React context/provider for runtime light/dark mode switching with localStorage persistence, and a base Tailwind CSS configuration that maps all design tokens to the generated CSS variables.

---

## Exports

### Provider and Hook

| Export | Type | Description |
|---|---|---|
| `ThemeProvider` | `React.FC<ThemeProviderProps>` | Context provider; applies theme CSS variables to DOM on mount and on theme/mode changes |
| `useTheme` | `() => ThemeContextValue` | Returns current theme state and setters; throws if used outside `ThemeProvider` |

### Default Themes

| Export | Type | Description |
|---|---|---|
| `defaultLightTheme` | `Theme` | Full default light theme object (blues primary, slate secondary, zinc neutral) |
| `defaultDarkTheme` | `Theme` | Dark variant — same as light but with inverted `neutral` palette |

### Utilities

| Export | Signature | Description |
|---|---|---|
| `generateCSSVariables(theme)` | `(theme: Theme) => Record<string, string>` | Converts `Theme` object to flat `{ '--color-primary-500': '#3b82f6', ... }` map |
| `applyThemeToDOM(theme)` | `(theme: Theme) => void` | Calls `generateCSSVariables` and sets all vars on `document.documentElement.style`; no-op in SSR |
| `mergeThemes(base, override)` | `(base: Theme, override: Partial<Theme>) => Theme` | Deep-merges two themes, preserving unspecified color shades from `base` |
| `saveThemeMode(mode)` | `(mode: ThemeMode) => void` | Saves mode to `localStorage` under key `'theme-mode'` |
| `loadThemeMode()` | `() => ThemeMode \| null` | Reads mode from `localStorage`; returns `null` if not set or invalid |

### Types

| Export | Type | Description |
|---|---|---|
| `Theme` | `interface` | Full theme object structure |
| `ThemeMode` | `'light' \| 'dark'` | Mode discriminant |
| `ThemeContextValue` | `interface` | Return type of `useTheme()` |
| `ThemeColors` | `interface` | Color section of `Theme` |
| `ColorPalette` | `interface` | Single color scale (50–950) |
| `TypographyScale` | `interface` | Font size scale |
| `SpacingScale` | `interface` | Spacing scale |
| `BorderRadiusScale` | `interface` | Border radius scale |
| `ShadowScale` | `interface` | Box shadow scale |
| `FontFamily` | `interface` | Font family arrays |

---

## Type Definitions

### `ThemeProviderProps`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `children` | `React.ReactNode` | Yes | — | Content to wrap with the theme context |
| `initialTheme` | `Theme` | No | `defaultLightTheme` | Starting theme object |
| `initialMode` | `ThemeMode` | No | `'light'` | Starting light/dark mode |

### `ThemeContextValue`

| Property | Type | Description |
|---|---|---|
| `theme` | `Theme` | The currently active theme object |
| `mode` | `ThemeMode` | The current mode (`'light'` or `'dark'`) |
| `setMode` | `(mode: ThemeMode) => void` | Switches mode and persists the choice to `localStorage` |
| `setTheme` | `(theme: Partial<Theme>) => void` | Deep-merges the provided partial theme with the current theme via `mergeThemes` |

### `ColorPalette`

Each color scale has optional shade keys from `50` through `950` (all `string` values representing CSS color values). The shades are `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, and `950`.

### `ThemeColors`

| Property | Type | Description |
|---|---|---|
| `primary` | `ColorPalette` | Primary brand color scale |
| `secondary` | `ColorPalette` | Secondary color scale |
| `neutral` | `ColorPalette` | Neutral/grey color scale (inverted in dark mode) |
| `success` | `ColorPalette` | Success state color scale |
| `warning` | `ColorPalette` | Warning state color scale |
| `error` | `ColorPalette` | Error state color scale |

### `Theme`

| Property | Type | Description |
|---|---|---|
| `colors` | `ThemeColors` | Color palettes for all semantic scales |
| `typography.fontFamily` | `FontFamily` | Font family arrays for `sans`, `serif`, and `mono` |
| `typography.fontSize` | `TypographyScale` | Font size entries from `xs` through `6xl`; each value is a size string or `[size, { lineHeight }]` tuple |
| `spacing` | `SpacingScale` | Spacing values for `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` |
| `borderRadius` | `BorderRadiusScale` | Border radius values for `none`, `sm`, `md`, `lg`, `xl`, `full` |
| `boxShadow` | `ShadowScale` | Box shadow values for `sm`, `md`, `lg`, `xl`, `2xl` |

---

## CSS Variables Generated

`generateCSSVariables(theme)` produces CSS custom properties set on `:root` (`document.documentElement`). All variables follow these naming patterns:

**Colors:** `--color-{scale}-{shade}` for each shade (50–950) of each color scale (`primary`, `secondary`, `neutral`, `success`, `warning`, `error`).

**Typography:** `--font-family-sans`, `--font-family-serif`, `--font-family-mono`; `--text-{size}` for font sizes; `--leading-{size}` for line heights (both from `xs` through `6xl`).

**Spacing:** `--spacing-{key}` for each key (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`).

**Border radius:** `--radius-{key}` for each key (`none`, `sm`, `md`, `lg`, `xl`, `full`).

**Box shadow:** `--shadow-{key}` for each key (`sm`, `md`, `lg`, `xl`, `2xl`).

---

## Default Theme Values

### `defaultLightTheme` (colors excerpt)

| Token | 500 value |
|---|---|
| `primary` | `#3b82f6` (blue-500) |
| `secondary` | `#64748b` (slate-500) |
| `neutral` | `#737373` (neutral-500) |
| `success` | `#22c55e` (green-500) |
| `warning` | `#f59e0b` (amber-500) |
| `error` | `#ef4444` (red-500) |

Font families: `sans: ['Inter', 'system-ui', 'sans-serif']`, `serif: ['Georgia', 'serif']`, `mono: ['JetBrains Mono', 'ui-monospace', 'monospace']`

### `defaultDarkTheme`

Identical to `defaultLightTheme` except the `neutral` palette is inverted (50 ↔ 950 etc.) so text/background colors flip for dark mode.

---

## Setup

### Basic setup

```tsx
import { ThemeProvider } from '@open-kingdom/shared-frontend-ui-theme';

export function App() {
  return (
    <ThemeProvider>
      {/* All CSS variables are now set on :root */}
      <YourApp />
    </ThemeProvider>
  );
}
```

### With custom initial theme

```tsx
import { ThemeProvider, defaultLightTheme } from '@open-kingdom/shared-frontend-ui-theme';
import type { Theme } from '@open-kingdom/shared-frontend-ui-theme';

const brandTheme: Theme = {
  ...defaultLightTheme,
  colors: {
    ...defaultLightTheme.colors,
    primary: {
      ...defaultLightTheme.colors?.primary,
      500: '#7c3aed', // override mid-range to purple
      600: '#6d28d9',
    },
  },
};

<ThemeProvider initialTheme={brandTheme} initialMode="light">
  <App />
</ThemeProvider>
```

---

## Usage in Components

### `useTheme` hook

`useTheme()` returns a `ThemeContextValue` with the current `theme`, the current `mode` (`'light'` or `'dark'`), a `setMode` function that switches modes and persists the choice to localStorage, and a `setTheme` function that deep-merges a partial theme override with the current theme.

```tsx
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';

function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      Switch to {mode === 'light' ? 'dark' : 'light'} mode
    </button>
  );
}
```

### Runtime theme override

```tsx
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';

function BrandSwitcher() {
  const { setTheme } = useTheme();

  const applyBrand = () => {
    setTheme({
      colors: {
        primary: { 500: '#7c3aed', 600: '#6d28d9' },
      },
    });
    // CSS variables update immediately on document.documentElement
  };
}
```

### Using CSS variables directly

```css
.my-component {
  background-color: var(--color-primary-500);
  color: var(--color-neutral-900);
  font-family: var(--font-family-sans);
  font-size: var(--text-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

### Using Tailwind utility classes

All Tailwind classes referencing theme tokens use CSS variables as their values, so they automatically reflect runtime theme changes:

```tsx
<div className="bg-primary-500 text-neutral-50 rounded-md shadow-md p-md">
  <h1 className="text-2xl font-sans">Hello</h1>
</div>
```

---

## Tailwind Configuration

### Using the base config as a preset in your app

```javascript
// tailwind.config.js (in your application or library)
const baseConfig = require('@open-kingdom/shared-frontend-ui-theme/tailwind.config.js');

module.exports = {
  presets: [baseConfig],
  content: [
    './src/**/*.{ts,tsx}',
    // Include paths of UI libraries you consume:
    '../../libs/shared/frontend/ui-notifications/src/**/*.{ts,tsx}',
    '../../libs/shared/frontend/feature-notifications/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Your app-specific overrides:
    },
  },
};
```

### What the base config does

The base config extends Tailwind's default theme with CSS-variable-backed values for all design tokens. This means Tailwind generates utility classes like `bg-primary-500` whose actual color value resolves at runtime from `var(--color-primary-500)`. Changing the theme via `ThemeProvider` / `setTheme` updates the CSS variables and all Tailwind-class-styled elements update instantly without a rebuild.

---

## Utility Function Examples

```typescript
import {
  generateCSSVariables,
  applyThemeToDOM,
  mergeThemes,
  saveThemeMode,
  loadThemeMode,
  defaultLightTheme,
  defaultDarkTheme,
} from '@open-kingdom/shared-frontend-ui-theme';

// Generate variable map (useful for SSR/injection):
const vars = generateCSSVariables(defaultLightTheme);
// { '--color-primary-50': '#eff6ff', '--color-primary-500': '#3b82f6', ... }

// Apply to DOM directly (ThemeProvider does this automatically):
applyThemeToDOM(defaultDarkTheme);

// Deep-merge two themes:
const merged = mergeThemes(defaultLightTheme, {
  colors: { primary: { 500: '#7c3aed' } },
});

// Persist and restore mode:
saveThemeMode('dark');
const savedMode = loadThemeMode(); // 'dark' | 'light' | null
```

---

## Architecture

The package is structured as follows:

- `src/index.ts` — Public exports: theme types, defaults, provider, and utilities
- `tailwind.config.js` — Base Tailwind preset (CSS-variable-backed tokens); exported directly from the package root via the `exports` map, resolving to `dist/tailwind.config.js`
- `src/lib/theme.types.ts` — `Theme`, `ThemeMode`, `ThemeContextValue`, `ColorPalette`, and related interfaces
- `src/lib/default-theme.ts` — `defaultLightTheme` and `defaultDarkTheme` objects
- `src/lib/theme-provider.tsx` — `ThemeProvider` React component and `useTheme` hook
- `src/lib/theme-utils.ts` — `generateCSSVariables`, `applyThemeToDOM`, `mergeThemes`, `saveThemeMode`, `loadThemeMode`

### Theme flow

1. `ThemeProvider` initializes with `defaultLightTheme` and checks `localStorage` for a saved mode
2. On mount and on every `theme` change, `applyThemeToDOM(theme)` sets CSS variables on `:root`
3. When mode changes, `ThemeProvider` switches between `defaultLightTheme` and `defaultDarkTheme` (unless a custom `initialTheme` was passed)
4. All Tailwind classes and direct `var()` CSS references update instantly
5. `saveThemeMode` persists the selected mode so it survives page reloads

---

## Best Practices

1. Use semantic color tokens (`primary-500`, `error-700`) rather than hardcoded hex values
2. Always include dark mode variants for components that use theme colors: `text-neutral-900 dark:text-neutral-100`
3. Pass the `Theme` object from `useTheme()` directly to `DataGrid`'s `theme` prop — it accepts the `UITheme` subset
4. Call `setTheme` for brand overrides rather than replacing the entire theme — it deep-merges with the current values
5. Do not use Tailwind `dark:` variants based on `prefers-color-scheme`; use the `mode` state from `useTheme()` and apply the dark theme object through `ThemeProvider` instead

---

## Testing

```bash
nx test shared-frontend-ui-theme
```
