/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PPLPlugin = function (Client, config, components) {
  const ca = components.clientAction.factory;
  Client.prototype.ppl = components.clientAction.namespaceFactory();
  const ppl = Client.prototype.ppl.prototype;

  ppl.pplQuery = ca({
    url: {
      fmt: `/_plugins/_ppl`,
      params: {
        format: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  ppl.sqlQuery = ca({
    url: {
      fmt: `/_plugins/_sql`,
      params: {
        format: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });
};
