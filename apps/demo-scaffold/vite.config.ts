/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/demo-scaffold',
  resolve: {
    conditions: ['@open-kingdom/source', 'browser', 'module', 'import', 'default'],
    alias: {
      '@open-kingdom/demo-scaffold-frontend-feature-root-store': path.resolve(
        __dirname,
        '../../libs/demo-scaffold/frontend/feature-root-store/src/index.ts'
      ),
    },
  },
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || ''
    ),
  },
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
