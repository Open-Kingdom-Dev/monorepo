/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../../node_modules/.vite/libs/shared/frontend/ui-theme',
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
    {
      name: 'copy-static-assets',
      closeBundle() {
        copyFileSync(
          path.join(__dirname, 'src/tailwind.config.js'),
          path.join(__dirname, 'dist/tailwind.config.js')
        );
        mkdirSync(path.join(__dirname, 'dist/styles'), { recursive: true });
        copyFileSync(
          path.join(__dirname, 'src/styles/tokens.css'),
          path.join(__dirname, 'dist/styles/tokens.css')
        );
      },
    },
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: '@open-kingdom/shared-ui-theme',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'clsx',
        'tailwind-merge',
      ],
    },
  },
}));
