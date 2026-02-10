module.exports = {
  displayName: '@open-kingdom/feature-user-management',
  preset: '../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-hookz/web|@ver0/deep-equal)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  coveragePathIgnorePatterns: ['src/lib/types.ts'],
};
