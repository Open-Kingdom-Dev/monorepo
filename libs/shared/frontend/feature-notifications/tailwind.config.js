// eslint-disable-next-line @nx/enforce-module-boundaries -- package export points at gitignored dist/; src path works before ui-theme is built
const baseConfig = require('../ui-theme/src/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [baseConfig],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Library-specific theme extensions can go here
    },
  },
  plugins: [],
};
