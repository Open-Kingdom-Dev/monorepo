export default {
  displayName: '@open-kingdom/shared-frontend-feature-error-autologger',
  preset: '../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'error-autologger.types.ts',
    'index.ts',
  ],
  reporters: [
    'default',
    [
      '../../../../node_modules/jest-html-reporter',
      {
        pageTitle: 'Test Report',
      },
    ],
  ],
};
