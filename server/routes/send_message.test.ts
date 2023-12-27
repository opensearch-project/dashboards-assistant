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
import { registerChatRoutes, LLMRequestSchema, AgentIdNotFoundError } from './chat_routes';
import { ASSISTANT_API } from '../../common/constants/llm';

const mockedLogger = loggerMock.create();

describe('send_message route when rootAgentId is provided', () => {
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
  const sendMessageRequest = (payload: LLMRequestSchema) =>
    triggerHandler(router, {
      method: 'post',
      path: ASSISTANT_API.SEND_MESSAGE,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
    resetMocks();
  });
  it('return back successfully when requestLLM returns momery back', async () => {
    mockOllyChatService.requestLLM.mockImplementationOnce(async () => {
      return {
        messages: [],
        memoryId: 'foo',
        interactionId: 'interaction_id',
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
    const result = (await sendMessageRequest({
      input: {
        content: '1',
        contentType: 'text',
        type: 'input',
        context: {},
      },
    })) as ResponseObject;
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "interactions": Array [],
        "messages": Array [],
        "sessionId": "foo",
        "title": "foo",
      }
    `);
    expect(mockAgentFrameworkStorageService.getSession).toBeCalledTimes(1);
  });

  it('should call getInteraction when sessionId is provided in request payload', async () => {
    mockOllyChatService.requestLLM.mockImplementationOnce(async () => {
      return {
        messages: [],
        memoryId: 'foo',
        interactionId: 'interaction_id',
      };
    });
    mockAgentFrameworkStorageService.getInteraction.mockImplementationOnce(async () => {
      return {
        input: 'input',
        response: 'response',
        conversation_id: '',
        interaction_id: 'interaction_id',
        create_time: 'create_time',
      };
    });
    mockAgentFrameworkStorageService.getMessagesFromInteractions.mockImplementationOnce(
      async () => []
    );
    const result = (await sendMessageRequest({
      input: {
        content: '1',
        contentType: 'text',
        type: 'input',
        context: {},
      },
      sessionId: 'foo',
    })) as ResponseObject;
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "interactions": Array [
          Object {
            "conversation_id": "",
            "create_time": "create_time",
            "input": "input",
            "interaction_id": "interaction_id",
            "response": "response",
          },
        ],
        "messages": Array [],
        "sessionId": "foo",
      }
    `);
  });

  it('return 500 when requestLLM throws an error and no conversation id provided', async () => {
    mockOllyChatService.requestLLM.mockImplementationOnce(() => {
      throw new Error('something went wrong');
    });
    const result = (await sendMessageRequest({
      input: {
        content: '1',
        contentType: 'text',
        type: 'input',
        context: {},
      },
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

  it('return 500 when requestLLM return without memoryId and no conversation id provided', async () => {
    mockOllyChatService.requestLLM.mockImplementationOnce(async () => {
      return {
        messages: [],
        memoryId: '',
        interactionId: 'interaction_id',
      };
    });
    const result = (await sendMessageRequest({
      input: {
        content: '1',
        contentType: 'text',
        type: 'input',
        context: {},
      },
    })) as Boom;
    expect(mockedLogger.error).toBeCalledTimes(1);
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "Not a valid conversation",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
  });

  it('return successfully when requestLLM throws an error but conversation id provided', async () => {
    mockOllyChatService.requestLLM.mockImplementationOnce(() => {
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
    const result = (await sendMessageRequest({
      input: {
        content: '1',
        contentType: 'text',
        type: 'input',
        context: {
          appId: '',
        },
      },
      sessionId: 'foo',
    })) as ResponseObject;
    expect(mockedLogger.error).toBeCalledWith(new Error('something went wrong'));
    expect(result.source).toMatchInlineSnapshot(`
      Object {
        "interactions": Array [
          Object {
            "conversation_id": "foo",
            "create_time": "create_time",
            "input": "foo",
            "interaction_id": "interaction_id",
            "response": "bar",
          },
        ],
        "messages": Array [],
        "sessionId": "foo",
      }
    `);
  });

  it('return 500 when get session throws an error', async () => {
    mockOllyChatService.requestLLM.mockImplementationOnce(async () => {
      return {
        messages: [],
        memoryId: 'foo',
        interactionId: 'interaction_id',
      };
    });
    mockAgentFrameworkStorageService.getSession.mockImplementationOnce(() => {
      throw new Error('foo');
    });
    const result = (await sendMessageRequest({
      input: {
        content: '1',
        contentType: 'text',
        type: 'input',
        context: {
          appId: '',
        },
      },
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

describe('send_message route when rootAgentId is not provided', () => {
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
  const sendMessageRequest = (payload: LLMRequestSchema) =>
    triggerHandler(router, {
      method: 'post',
      path: ASSISTANT_API.SEND_MESSAGE,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
  });

  it('return 400', async () => {
    const result = (await sendMessageRequest({
      input: {
        content: '1',
        contentType: 'text',
        type: 'input',
        context: {
          appId: '',
        },
      },
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
