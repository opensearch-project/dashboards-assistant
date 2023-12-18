/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseObject } from '@hapi/hapi';
import { Boom } from '@hapi/boom';
import { Router } from '../../../../src/core/server/http/router';
import { enhanceWithContext, triggerHandler } from './router.mock';
import { mockOllyChatService } from '../services/chat/olly_chat_service.mock';
import { mockAgentFrameworkStorageService } from '../services/storage/agent_framework_storage_service.mock';
import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';
import { registerChatRoutes, RegenerateSchema, AgentIdNotFoundError } from './chat_routes';
import { ASSISTANT_API } from '../../common/constants/llm';

const mockedLogger = loggerMock.create();

describe('regenerate route when rootAgentId is provided', () => {
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
    rootAgentId: 'foo',
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
  it('return back successfully when requestLLM returns momery back', async () => {
    mockOllyChatService.regenerate.mockImplementationOnce(async () => {
      return {
        messages: [],
        memoryId: 'foo',
      };
    });
    mockAgentFrameworkStorageService.getSession.mockImplementationOnce(async () => {
      return {
        messages: [],
        title: 'foo',
        interactions: [],
        createdTimeMs: 0,
        updatedTimeMs: 0,
      };
    });
    const result = (await regenerateRequest({
      sessionId: 'foo',
      interactionId: 'bar',
    })) as ResponseObject;
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "createdTimeMs": 0,
        "interactions": Array [],
        "messages": Array [],
        "sessionId": "foo",
        "title": "foo",
        "updatedTimeMs": 0,
      }
    `);
  });

  it('log error when requestLLM throws an error', async () => {
    mockOllyChatService.regenerate.mockImplementationOnce(() => {
      throw new Error('something went wrong');
    });
    mockAgentFrameworkStorageService.getSession.mockImplementationOnce(async () => {
      return {
        messages: [],
        title: 'foo',
        interactions: [],
        createdTimeMs: 0,
        updatedTimeMs: 0,
      };
    });
    const result = (await regenerateRequest({
      sessionId: 'foo',
      interactionId: 'bar',
    })) as ResponseObject;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "createdTimeMs": 0,
        "interactions": Array [],
        "messages": Array [],
        "sessionId": "foo",
        "title": "foo",
        "updatedTimeMs": 0,
      }
    `);
  });

  it('return 500 when get session throws an error', async () => {
    mockOllyChatService.regenerate.mockImplementationOnce(async () => {
      return {
        messages: [],
        memoryId: 'foo',
      };
    });
    mockAgentFrameworkStorageService.getSession.mockImplementationOnce(() => {
      throw new Error('foo');
    });
    const result = (await regenerateRequest({
      sessionId: 'foo',
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

describe('regenerate route when rootAgentId is not provided', () => {
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
      sessionId: 'foo',
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(mockedLogger.error).toBeCalledWith(AgentIdNotFoundError);
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Bad Request",
          "message": "rootAgentId is required, please specify one in opensearch_dashboards.yml",
          "statusCode": 400,
        },
        "statusCode": 400,
      }
    `);
  });
});
