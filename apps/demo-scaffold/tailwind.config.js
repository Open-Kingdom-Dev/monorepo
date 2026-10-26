const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
// eslint-disable-next-line @nx/enforce-module-boundaries -- package export points at gitignored dist/; src path works before ui-theme is built
const baseConfig = require('../../libs/shared/frontend/ui-theme/src/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [baseConfig],
  content: [
    join(
      __dirname,
      '{src,pages,components,app,libs}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      // App-specific theme overrides can go here
    },
  },
  plugins: [require('tailwindcss-animate')],
};
