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
import { GetConversationsSchema, registerChatRoutes } from './chat_routes';
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

describe('getConversations route', () => {
  const getConversationsRequest = (payload: GetConversationsSchema) =>
    triggerHandler(router, {
      method: 'get',
      path: `${ASSISTANT_API.CONVERSATIONS}`,
      req: httpServerMock.createRawRequest({
        query: payload,
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
  });
  it('return back successfully when getConversations returns conversations back', async () => {
    mockAgentFrameworkStorageService.getConversations.mockImplementationOnce(async () => {
      return {
        objects: [],
        total: 0,
      };
    });
    const result = (await getConversationsRequest({
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

  it('return 500 when getConversations throws error', async () => {
    mockAgentFrameworkStorageService.getConversations.mockImplementationOnce(() => {
      throw new Error('getConversations error');
    });
    const result = (await getConversationsRequest({
      perPage: 10,
      page: 1,
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(2);
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "Internal Error",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
  });

  it('return empty result when getConversations rejected with 404 status code', async () => {
    mockAgentFrameworkStorageService.getConversations.mockRejectedValueOnce({
      meta: {
        statusCode: 404,
      },
    });

    expect(mockAgentFrameworkStorageService.deleteConversation).not.toHaveBeenCalled();
    const result = (await getConversationsRequest({
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
});
