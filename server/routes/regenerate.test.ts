/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseObject } from '@hapi/hapi';
import { Boom } from '@hapi/boom';
import { Router } from '../../../../src/core/server/http/router';
import { enhanceWithContext, triggerHandler } from './router.mock';
import { mockOllyChatService } from '../services/chat/olly_chat_service.mock';
import {
  mockAgentFrameworkStorageService,
  resetMocks,
} from '../services/storage/agent_framework_storage_service.mock';
import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';
import { registerChatRoutes, RegenerateSchema, AgentNameNotFoundError } from './chat_routes';
import { ASSISTANT_API } from '../../common/constants/llm';

const mockedLogger = loggerMock.create();

describe('regenerate route when rootAgentName is provided', () => {
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
    rootAgentName: 'foo',
  });
  const regenerateRequest = (payload: RegenerateSchema) =>
    triggerHandler(router, {
      method: 'put',
      path: ASSISTANT_API.REGENERATE,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
    resetMocks();
  });
  it('return back successfully when regenerate returns momery back', async () => {
    mockOllyChatService.regenerate.mockImplementationOnce(async () => {
      return {
        messages: [],
        conversationId: 'foo',
        interactionId: 'interaction_id',
      };
    });
    mockAgentFrameworkStorageService.getInteraction.mockImplementationOnce(async () => {
      return {
        input: 'foo',
        response: 'bar',
        conversation_id: 'foo',
        interaction_id: 'interaction_id',
        create_time: 'create_time',
      };
    });
    mockAgentFrameworkStorageService.getMessagesFromInteractions.mockImplementationOnce(
      async () => {
        return [
          {
            contentType: 'markdown',
            type: 'output',
            content: 'output',
          },
        ];
      }
    );
    const result = (await regenerateRequest({
      conversationId: 'foo',
      interactionId: 'bar',
    })) as ResponseObject;
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "conversationId": "foo",
        "interactions": Array [
          Object {
            "conversation_id": "foo",
            "create_time": "create_time",
            "input": "foo",
            "interaction_id": "interaction_id",
            "response": "bar",
          },
        ],
        "messages": Array [
          Object {
            "content": "output",
            "contentType": "markdown",
            "type": "output",
          },
        ],
      }
    `);
  });

  it('log error when regenerate throws an error', async () => {
    mockOllyChatService.regenerate.mockImplementationOnce(() => {
      throw new Error('something went wrong');
    });
    mockAgentFrameworkStorageService.getInteraction.mockImplementationOnce(async () => {
      return {
        input: 'foo',
        response: 'bar',
        conversation_id: 'foo',
        interaction_id: 'interaction_id',
        create_time: 'create_time',
      };
    });
    mockAgentFrameworkStorageService.getMessagesFromInteractions.mockImplementationOnce(
      async () => []
    );
    const result = (await regenerateRequest({
      conversationId: 'foo',
      interactionId: 'bar',
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "something went wrong",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
  });

  it('return 500 when get conversation throws an error', async () => {
    mockOllyChatService.regenerate.mockImplementationOnce(async () => {
      return {
        messages: [],
        conversationId: 'foo',
        interactionId: 'interaction_id',
      };
    });
    mockAgentFrameworkStorageService.getInteraction.mockImplementationOnce(() => {
      throw new Error('foo');
    });
    const result = (await regenerateRequest({
      conversationId: 'foo',
      interactionId: 'bar',
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(mockedLogger.error).toBeCalledWith(new Error('foo'));
    expect(result.output).toMatchInlineSnapshot(`
        Object {
          "headers": Object {},
          "payload": Object {
            "error": "Internal Server Error",
            "message": "foo",
            "statusCode": 500,
          },
          "statusCode": 500,
        }
      `);
  });
});

describe('regenerate route when rootAgentName is not provided', () => {
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
  const regenerateRequest = (payload: RegenerateSchema) =>
    triggerHandler(router, {
      method: 'put',
      path: ASSISTANT_API.REGENERATE,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
  });

  it('return 400', async () => {
    const result = (await regenerateRequest({
      interactionId: 'bar',
      conversationId: 'foo',
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(mockedLogger.error).toBeCalledWith(AgentNameNotFoundError);
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Bad Request",
          "message": "rootAgentName is required, please specify one in opensearch_dashboards.yml",
          "statusCode": 400,
        },
        "statusCode": 400,
      }
    `);
  });
});
