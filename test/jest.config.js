/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

process.env.TZ = 'UTC';

module.exports = {
  rootDir: '../',
  setupFiles: ['<rootDir>/test/setupTests.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.jest.ts'],
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
  clearMocks: true,
  modulePathIgnorePatterns: ['<rootDir>/offline-module-cache/'],
  testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/', '/__utils__/'],
  coveragePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/node_modules/',
    '<rootDir>/test/',
    '<rootDir>/public/requests/',
    '/__utils__/',
  ],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/test/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/test/__mocks__/fileMock.js',
    '^!!raw-loader!.*': 'jest-raw-loader',
  },
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    // ignore all node_modules except those which require babel transforms to handle dynamic import()
    // since ESM modules are not natively supported in Jest yet (https://github.com/facebook/jest/issues/4842)
    '[/\\\\]node_modules(?![\\/\\\\](monaco-editor|weak-lru-cache|ordered-binary|d3-color|axios))[/\\\\].+\\.js$',
  ],
};
