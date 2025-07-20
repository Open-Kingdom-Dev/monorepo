export default {
  displayName: '@ynaa/demo-scaffold',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/entry.server.tsx',
    '!app/entry.client.tsx', 
    '!app/root.tsx',
    '!app/routes.tsx',
    '!**/*.d.ts',
    '!**/.react-router/**',
  ],
};
