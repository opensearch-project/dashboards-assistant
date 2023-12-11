/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseObject } from '@hapi/hapi';
import { Boom } from '@hapi/boom';
import { Router } from '../../../../src/core/server/http/router';
import { enhanceWithContext, triggerHandler } from './router.mock';
import { mockAgentFrameworkStorageService } from '../services/storage/agent_framework_storage_service.mock';
import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';
import { GetSessionsSchema, registerChatRoutes } from './chat_routes';
import { ASSISTANT_API } from '../../common/constants/llm';

const mockedLogger = loggerMock.create();

const router = new Router(
  '',
  mockedLogger,
  enhanceWithContext({
    assistant_plugin: {
      logger: mockedLogger,
    },
  })
);
registerChatRoutes(router, {
  messageParsers: [],
});

describe('getSessions route', () => {
  const getSessionsRequest = (payload: GetSessionsSchema) =>
    triggerHandler(router, {
      method: 'get',
      path: `${ASSISTANT_API.SESSIONS}`,
      req: httpServerMock.createRawRequest({
        query: payload,
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
  });
  it('return back successfully when getSessions returns sessions back', async () => {
    mockAgentFrameworkStorageService.getSessions.mockImplementationOnce(async () => {
      return {
        objects: [],
        total: 0,
      };
    });
    const result = (await getSessionsRequest({
      perPage: 10,
      page: 1,
    })) as ResponseObject;
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "objects": Array [],
        "total": 0,
      }
    `);
  });

  it('return 500 when getSessions throws error', async () => {
    mockAgentFrameworkStorageService.getSessions.mockImplementationOnce(() => {
      throw new Error('getSessions error');
    });
    const result = (await getSessionsRequest({
      perPage: 10,
      page: 1,
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "getSessions error",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
  });
});
