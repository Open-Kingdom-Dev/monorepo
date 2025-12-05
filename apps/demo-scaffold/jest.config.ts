export default {
  displayName: '@open-kingdom/demo-scaffold',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/app/test-setup.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-hookz/web|@ver0/deep-equal)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  testMatch: [
    '<rootDir>/src/**/*.spec.{ts,tsx}',
    '<rootDir>/app/**/*.spec.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.spec.{ts,tsx}',
    '!app/entry.server.tsx',
    '!app/entry.client.tsx',
    '!app/root.tsx',
    '!app/routes.tsx',
    '!app/app-layout.tsx',
    '!app/main.tsx',
    '!app/components/index.ts',
    '!app/components/GridExample.tsx',
    '!app/components/AdvancedGridExample.tsx',
    '!app/components/Profile.tsx',
    '!app/components/ErrorAutologgerExample.tsx',
    '!**/*.d.ts',
    '!**/.react-router/**',
  ],
  reporters: [
    'default',
    [
      '../../node_modules/jest-html-reporter',
      {
        pageTitle: 'Test Report',
      },
    ],
  ],
};
