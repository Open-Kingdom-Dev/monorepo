# @open-kingdom/shared-frontend-ui-theme

Tailwind CSS preset, design tokens, and light/dark mode helpers for OpenKingdom frontend apps.

## Install

```bash
npm install @open-kingdom/shared-frontend-ui-theme
```

## Set up in 3 steps

### 1. Import the tokens in your app's main CSS

```css
/* styles.css */
@import '@open-kingdom/shared-frontend-ui-theme/styles/tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Why:** `tokens.css` defines the HSL CSS variables (`--primary`, `--background`, etc.) under `:root` and `.dark`. The Tailwind preset in step 2 references these variables — the classes won't resolve if the file isn't loaded. Importing it before `@tailwind` ensures the variables exist by the time Tailwind's base layer emits `body { @apply bg-background text-foreground }`.

### 2. Use the preset in `tailwind.config.js`

```js
const preset = require('@open-kingdom/shared-frontend-ui-theme/tailwind.config.js');

module.exports = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx,html}', './node_modules/@open-kingdom/shared-frontend-*/dist/**/*.{js,mjs}', './node_modules/@open-kingdom/shared-feature-*/dist/**/*.{js,mjs}'],
};
```

**Why:** The preset provides the semantic color mappings (`bg-primary` → `hsl(var(--primary))`) and `darkMode: 'class'`. The two `node_modules` globs are required because Tailwind v3 only scans files listed in `content` — classes in published `dist` files would otherwise be purged. The globs are scoped to `shared-frontend-*` and `shared-feature-*` to avoid scanning backend packages (which don't ship Tailwind classes). Tailwind v3 does not merge `content` arrays from presets, so the globs must live in your config, not the preset.

Install only the packages you need — the globs only match what's actually present in `node_modules`.

### 3. Add the anti-flash script to `index.html`

```html
<script>
  try {
    if (localStorage.getItem('theme-mode') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
</script>
```

**Why:** If a user's last selection was dark mode, the page must render with the `dark` class on `<html>` _before_ CSS paints — otherwise they see a light→dark flash on every load. This must be an inline `<script>` in `<head>` so the browser executes it synchronously before applying stylesheets; React components, `useLayoutEffect`, and ES module side effects all run after the initial paint and cannot prevent the flash in a Vite SPA.

Done. Use semantic classes like `bg-primary`, `text-foreground`, `border-input` anywhere in your app.

## Toggle dark mode

```tsx
import { useColorMode } from '@open-kingdom/shared-frontend-ui-theme';

function ThemeToggle() {
  const { mode, setMode } = useColorMode();
  return <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>{mode === 'light' ? 'Dark' : 'Light'} mode</button>;
}
```

## Customize brand colors

Override the CSS variables after importing `tokens.css`:

```css
@import '@open-kingdom/shared-frontend-ui-theme/styles/tokens.css';

:root {
  --primary: 262 83% 58%;
  --primary-foreground: 0 0% 100%;
}

.dark {
  --primary: 262 70% 68%;
}
```

Values are HSL triplets without the `hsl()` wrapper — the preset wraps them as `hsl(var(--primary))` at build time, which lets Tailwind generate opacity modifiers (`bg-primary/50`) automatically.

Override order matters: your CSS variables must come after the `@import` so they win the cascade. Every Tailwind class (`bg-primary`, `text-foreground`, etc.) will instantly reflect the new values — no rebuild needed.

## API

| Export         | Description                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `cn`           | `clsx` + `tailwind-merge` — merges class names and resolves Tailwind conflicts |
| `getColorMode` | Read the current mode from `localStorage`                                      |
| `setColorMode` | Set the mode (persists + toggles `.dark` on `<html>`)                          |
| `useColorMode` | React hook returning `{ mode, setMode }`, re-renders on mode changes           |
