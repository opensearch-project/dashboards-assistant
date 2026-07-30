/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// babelrc doesn't respect NODE_PATH anymore but using require does.
// Alternative to install them locally in node_modules
const pathAliasPlugin = require('@osd/babel-preset/path_alias');

module.exports = function (api) {
  // ensure env is test so that this config won't impact build or dev server
  if (api.env('test')) {
    return {
      presets: [
        [
          require('@babel/preset-env'),
          {
            useBuiltIns: false,
            // Deliberately no `targets`: this preset has always run target-less
            // here, and narrowing to `node: 'current'` changes the whole output
            // (native let/const, classes, ...) which breaks existing suites.
            //
            // The exponentiation transform is the one thing we must turn off:
            // it rewrites `a ** b` to `Math.pow(a, b)`, which throws
            // "Cannot convert a BigInt value to a number" on BigInt operands
            // (`2n ** 63n`) reachable through osd-monaco. Jest runs on Node,
            // which supports `**` natively, so skipping it is safe.
            exclude: ['@babel/plugin-transform-exponentiation-operator'],
          },
        ],
        require('@babel/preset-react'),
        require('@babel/preset-typescript'),
      ],
      plugins: [pathAliasPlugin({})],
    };
  }
  return {};
};
