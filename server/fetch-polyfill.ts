/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// fetch and web-streams-polyfill are needed to run langchain on node16

import fetch, { Headers, Request, Response } from 'node-fetch';

if (!globalThis.fetch) {
  globalThis.fetch = (fetch as unknown) as typeof globalThis.fetch;
  globalThis.Headers = (Headers as unknown) as typeof globalThis.Headers;
  globalThis.Request = (Request as unknown) as typeof globalThis.Request;
  globalThis.Response = (Response as unknown) as typeof globalThis.Response;
}
