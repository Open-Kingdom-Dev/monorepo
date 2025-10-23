# Shared UI Theme Library

This library provides a comprehensive theming system for the Nx workspace, including Tailwind CSS configuration, theme management, and dark/light mode support.

## Features

- **Centralized Theme Configuration**: Single source of truth for design tokens
- **CSS Custom Properties**: Runtime theme changes via CSS variables
- **Dark/Light Mode Support**: Automatic theme switching with persistence
- **TypeScript Support**: Full type safety for theme objects
- **Tailwind Integration**: Seamless integration with Tailwind CSS
- **React Context**: Easy theme management with React hooks

## Usage

### Basic Setup

1. **Import the ThemeProvider** in your app's root component:

```tsx
import { ThemeProvider } from '@open-kingdom/shared-frontend-ui-theme';

export function App() {
  return <ThemeProvider>{/* Your app content */}</ThemeProvider>;
}
```

2. **Use the theme hook** in your components:

```tsx
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';

export function MyComponent() {
  const { theme, mode, setMode } = useTheme();

  return (
    <div className="bg-primary-500 text-white">
      <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>Toggle Theme</button>
    </div>
  );
}
```

### Tailwind Configuration

The library provides a base Tailwind configuration that can be extended by applications and other libraries:

```javascript
// tailwind.config.js
const baseConfig = require('@open-kingdom/shared-frontend-ui-theme/src/tailwind.config.js');

module.exports = {
  presets: [baseConfig],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Your custom theme overrides
    },
  },
};
```

### Available Design Tokens

#### Colors

- `primary-50` to `primary-950`: Primary color palette
- `secondary-50` to `secondary-950`: Secondary color palette
- `neutral-50` to `neutral-950`: Neutral color palette
- `success-50` to `success-950`: Success color palette
- `warning-50` to `warning-950`: Warning color palette
- `error-50` to `error-950`: Error color palette

#### Typography

- Font families: `font-sans`, `font-serif`, `font-mono`
- Font sizes: `text-xs` to `text-6xl`
- Line heights: Automatically applied with font sizes

#### Spacing

- Custom spacing scale: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`

#### Border Radius

- Custom radius scale: `none`, `sm`, `md`, `lg`, `xl`, `full`

#### Box Shadows

- Custom shadow scale: `sm`, `md`, `lg`, `xl`, `2xl`

### Theme Customization

You can customize themes by passing them to the ThemeProvider:

```tsx
import { ThemeProvider, defaultLightTheme } from '@open-kingdom/shared-frontend-ui-theme';

const customTheme = {
  ...defaultLightTheme,
  colors: {
    ...defaultLightTheme.colors,
    primary: {
      // Your custom primary colors
    },
  },
};

<ThemeProvider initialTheme={customTheme}>{/* Your app */}</ThemeProvider>;
```

### CSS Variables

The theme system automatically generates CSS custom properties that can be used in your CSS:

```css
.my-component {
  background-color: var(--color-primary-500);
  color: var(--color-neutral-900);
  font-family: var(--font-family-sans);
  font-size: var(--text-lg);
}
```

### Utilities

The library provides utility functions for theme management:

```tsx
import { generateCSSVariables, applyThemeToDOM, mergeThemes, saveThemeMode, loadThemeMode } from '@open-kingdom/shared-frontend-ui-theme';

// Generate CSS variables from a theme
const variables = generateCSSVariables(theme);

// Apply theme to DOM
applyThemeToDOM(theme);

// Merge themes
const mergedTheme = mergeThemes(baseTheme, overrideTheme);

// Save/load theme mode
saveThemeMode('dark');
const mode = loadThemeMode();
```

## Architecture

### File Structure

```
src/
├── index.ts                 # Main exports
├── tailwind.config.js       # Base Tailwind configuration
└── lib/
    ├── theme.types.ts       # TypeScript interfaces
    ├── default-theme.ts     # Default theme values
    ├── theme-provider.tsx   # React context and provider
    └── theme-utils.ts       # Utility functions
```

### Theme Flow

1. **ThemeProvider** initializes with default theme
2. **CSS Variables** are generated and applied to document root
3. **Components** use Tailwind classes that reference CSS variables
4. **Theme Changes** update CSS variables for immediate visual feedback
5. **Persistence** saves theme mode to localStorage

### Integration with Nx

- **Host Applications**: Extend the base Tailwind config
- **UI Libraries**: Use the base config as a preset
- **Peer Dependencies**: Tailwind CSS is a peer dependency
- **Type Safety**: Full TypeScript support across the workspace

## Best Practices

1. **Use Semantic Colors**: Always use semantic color tokens (e.g., `primary-500`) instead of hardcoded values
2. **Dark Mode Support**: Include dark mode variants for all components
3. **CSS Variables**: Leverage CSS variables for runtime customization
4. **Type Safety**: Use the provided TypeScript interfaces for theme objects
5. **Consistent Spacing**: Use the defined spacing scale for consistent layouts

## Examples

See the demo-scaffold application for a complete example of the theme system in action, including:

- Theme provider setup
- Dark/light mode switching
- Component theming with Tailwind classes
- Color palette demonstrations
