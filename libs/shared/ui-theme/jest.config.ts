export default {
  displayName: '@ynaa/shared-ui-theme',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-setup.ts'],
  reporters: [
    'default',
    [
      '../../../node_modules/jest-html-reporter',
      {
        pageTitle: 'Test Report',
      },
    ],
  ],
};
