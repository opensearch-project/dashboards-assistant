/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleError } from './error_handler';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';
import { AgentNotFoundError } from './errors';
import { opensearchDashboardsResponseFactory } from '../../../../src/core/server';

describe('Error handler', () => {
  it('should return 404 not found response if error is AgentNotFoundError', () => {
    const mockedLogger = loggerMock.create();
    const error = handleError(
      new AgentNotFoundError('test error'),
      opensearchDashboardsResponseFactory,
      mockedLogger
    );
    expect(error.status).toBe(404);
    expect(error.options.body).toMatchInlineSnapshot('"Agent not found"');
  });

  it('should return 4xx with original error body', () => {
    const mockedLogger = loggerMock.create();
    const error = handleError(
      {
        statusCode: 429,
        body: {
          status: 429,
          error: {
            type: 'OpenSearchStatusException',
            reason: 'System Error',
            details: 'Request is throttled at model level.',
          },
        },
      },
      opensearchDashboardsResponseFactory,
      mockedLogger
    );
    expect(error.status).toBe(429);
    expect(error.options.body).toMatchInlineSnapshot(`
    Object {
      "message": "{\\"status\\":429,\\"error\\":{\\"type\\":\\"OpenSearchStatusException\\",\\"reason\\":\\"System Error\\",\\"details\\":\\"Request is throttled at model level.\\"}}",
    }
    `);
  });

  it('shuld return generic 5xx error', () => {
    const mockedLogger = loggerMock.create();
    const error = handleError(
      {
        statusCode: 502,
        body: {
          status: 502,
          error: {
            type: 'OpenSearchStatusException',
            reason: 'System Error',
            details: 'Some bad thing happened',
          },
        },
      },
      opensearchDashboardsResponseFactory,
      mockedLogger
    );
    expect(error.status).toBe(502);

    // No extra info should returned
    expect(error.payload).toBe(undefined);
    expect(error.options.body).toBe(undefined);
  });

  it('should return generic internalError for unhandled server-side issues', () => {
    const mockedLogger = loggerMock.create();
    const error = handleError(
      new Error('Arbitrary Error'),
      opensearchDashboardsResponseFactory,
      mockedLogger
    );
    expect(error.status).toBe(500);
    expect(error.payload).toEqual('Internal Error');
    expect(error.options).toMatchInlineSnapshot('Object {}');
  });
});
