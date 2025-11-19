const { readFileSync } = require('fs');

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8')
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@open-kingdom/data-access-api-client',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.spec.{ts,js}',
    '!src/**/*.d.ts',
    '!src/lib/**/api.ts', // Exclude auto-generated API files
    '!src/lib/baseApi.ts', // Exclude baseApi (setup file)
    '!src/lib/index.ts', // Exclude index (re-exports)
    '!src/index.ts', // Exclude main index (re-exports)
    '!src/lib/**/openapi.json', // Exclude OpenAPI JSON files
  ],
};
