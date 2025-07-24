const baseConfig = require('../../ui-theme/src/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [baseConfig],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Library-specific theme extensions can go here
    },
  },
  plugins: [],
}; 