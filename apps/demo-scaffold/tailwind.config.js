const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
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
  plugins: [],
};
