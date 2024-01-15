/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseObject } from '@hapi/hapi';
import { Boom } from '@hapi/boom';
import { Router } from '../../../../src/core/server/http/router';
import { enhanceWithContext, triggerHandler } from './router.mock';
import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import { mockAgentFrameworkStorageService } from '../services/storage/agent_framework_storage_service.mock';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';
import { GetConversationSchema, registerChatRoutes } from './chat_routes';
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

describe('getConversation route', () => {
  const getConversationRequest = (payload: GetConversationSchema) =>
    triggerHandler(router, {
      method: 'get',
      path: `${ASSISTANT_API.CONVERSATION}/{conversationId}`,
      req: httpServerMock.createRawRequest({
        params: payload,
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
  });
  it('return back successfully when getConversation returns conversation back', async () => {
    mockAgentFrameworkStorageService.getConversation.mockImplementationOnce(async () => {
      return {
        messages: [],
        title: 'foo',
        interactions: [],
        createdTimeMs: 0,
        updatedTimeMs: 0,
      };
    });
    const result = (await getConversationRequest({
      conversationId: '1',
    })) as ResponseObject;
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "createdTimeMs": 0,
        "interactions": Array [],
        "messages": Array [],
        "title": "foo",
        "updatedTimeMs": 0,
      }
    `);
  });

  it('return 500 when getConversation throws error', async () => {
    mockAgentFrameworkStorageService.getConversation.mockImplementationOnce(() => {
      throw new Error('getConversation error');
    });
    const result = (await getConversationRequest({
      conversationId: '1',
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "getConversation error",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
  });
});
