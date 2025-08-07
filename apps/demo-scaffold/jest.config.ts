export default {
  displayName: '@ynaa/demo-scaffold',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/app/test-setup.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
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
