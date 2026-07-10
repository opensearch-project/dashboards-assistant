/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const osdConfig = require('@elastic/eslint-config-kibana');
const { eui } = require('@elastic/eslint-config-kibana/extras');

const LICENSE_HEADER = `/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */`;

module.exports = [
  // Replaces .eslintignore (ESLint 10 no longer reads it).
  { ignores: ['node_modules', 'build', 'target', '**/*.d.ts'] },
  ...osdConfig,
  ...eui,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 0,
      '@osd/eslint/require-license-header': ['error', { licenses: [LICENSE_HEADER] }],
    },
  },
];
