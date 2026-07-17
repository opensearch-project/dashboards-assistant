/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * query-string v9 is a pure ESM module whose index.js has only a default export.
 * Under Jest's CJS transform the default-import interop can resolve to `undefined`.
 * This shim (set as the moduleNameMapper target for 'query-string') loads the real
 * package via an absolute node_modules path so the mapper does not recurse, and
 * normalises the export shape back to a default export.
 *
 * The plugin has no local query-string; it lives in the parent repo's node_modules,
 * so resolve relative to this file (test/__mocks__ -> ../../../../node_modules).
 */

const path = require('path');
// eslint-disable-next-line import/no-dynamic-require
const mod = require(path.resolve(__dirname, '../../../../node_modules/query-string/index.js'));

// After the Babel + babel-plugin-add-module-exports pipeline, `mod` may be the raw
// namespace object `{ __esModule: true, stringify, parse, ... }` with no `.default`.
// Recover the actual API regardless of which shape we receive.
const api = mod && mod.__esModule && typeof mod.stringify !== 'function' ? mod.default : mod;

module.exports = {
  __esModule: true,
  default: api,
};
