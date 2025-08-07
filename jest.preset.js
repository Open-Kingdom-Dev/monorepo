const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/*.spec.{ts,tsx,js,jsx}',
    '!**/*.config.{ts,tsx,js,jsx}',
    '!**/*.test.{ts,tsx,js,jsx}',
    '!**/*.types.{ts,tsx,js,jsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/*.d.ts',
    '!**/jest.config.{js,ts}',
    '!**/test-setup.{js,ts}',
    '!**/index.spec.{js,ts}',
    '!**/index.{js,ts}',
    '!**/test-utils.{js,ts}',
    '!**/test-setup.{js,ts}',
  ],
  reporters: ['default'],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
