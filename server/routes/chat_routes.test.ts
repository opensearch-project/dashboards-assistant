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
import { mockOllyChatService } from '../services/chat/olly_chat_service.mock';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';
import { registerChatRoutes } from './chat_routes';
import { ASSISTANT_API } from '../../common/constants/llm';
import { getOpenSearchClientTransport } from '../utils/get_opensearch_client_transport';

jest.mock('../utils/get_opensearch_client_transport');

beforeEach(() => {
  (getOpenSearchClientTransport as jest.Mock).mockImplementation(({ dataSourceId }) => {
    if (dataSourceId) {
      return 'dataSource-client';
    } else {
      return 'client';
    }
  });
});
afterEach(() => {
  (getOpenSearchClientTransport as jest.Mock).mockClear();
});

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

const triggerDeleteConversation = (conversationId: string, dataSourceId?: string) =>
  triggerHandler(router, {
    method: 'delete',
    path: `${ASSISTANT_API.CONVERSATION}/{conversationId}`,
    req: httpServerMock.createRawRequest({
      params: { conversationId },
      ...(dataSourceId
        ? {
            query: {
              dataSourceId,
            },
          }
        : {}),
    }),
  });
const triggerUpdateConversation = (
  params: { conversationId: string },
  payload: { title: string },
  dataSourceId?: string
) =>
  triggerHandler(router, {
    method: 'put',
    path: `${ASSISTANT_API.CONVERSATION}/{conversationId}`,
    req: httpServerMock.createRawRequest({
      params,
      payload,
      ...(dataSourceId
        ? {
            query: {
              dataSourceId,
            },
          }
        : {}),
    }),
  });
const triggerGetTrace = (interactionId: string, dataSourceId?: string) =>
  triggerHandler(router, {
    method: 'get',
    path: `${ASSISTANT_API.TRACE}/{interactionId}`,
    req: httpServerMock.createRawRequest({
      params: { interactionId },
      ...(dataSourceId
        ? {
            query: {
              dataSourceId,
            },
          }
        : {}),
    }),
  });
const triggerAbortAgentExecution = (conversationId: string, dataSourceId?: string) =>
  triggerHandler(router, {
    method: 'post',
    path: ASSISTANT_API.ABORT_AGENT_EXECUTION,
    req: httpServerMock.createRawRequest({
      payload: { conversationId },
      ...(dataSourceId
        ? {
            query: {
              dataSourceId,
            },
          }
        : {}),
    }),
  });
const triggerFeedback = (
  params: { interactionId: string },
  payload: { satisfaction: boolean },
  dataSourceId?: string
) =>
  triggerHandler(router, {
    method: 'put',
    path: `${ASSISTANT_API.FEEDBACK}/{interactionId}`,
    req: httpServerMock.createRawRequest({
      params,
      payload,
      ...(dataSourceId
        ? {
            query: {
              dataSourceId,
            },
          }
        : {}),
    }),
  });

describe('chat routes', () => {
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('delete conversation', () => {
    it('should call delete conversation with passed conversation id and return consistent data', async () => {
      mockAgentFrameworkStorageService.deleteConversation.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.deleteConversation).not.toHaveBeenCalled();
      const result = (await triggerDeleteConversation('foo')) as ResponseObject;
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('client');
      expect(mockAgentFrameworkStorageService.deleteConversation).toHaveBeenCalledWith('foo');
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should call delete conversation with passed data source id and get data source transport', async () => {
      mockAgentFrameworkStorageService.deleteConversation.mockResolvedValueOnce({
        success: true,
      });
      expect(mockAgentFrameworkStorageService.deleteConversation).not.toHaveBeenCalled();
      const result = (await triggerDeleteConversation('foo', 'data_source_id')) as ResponseObject;
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('dataSource-client');
      expect(mockAgentFrameworkStorageService.deleteConversation).toHaveBeenCalledWith('foo');
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should log error and return 500 error', async () => {
      mockAgentFrameworkStorageService.deleteConversation.mockRejectedValueOnce(new Error());

      const result = (await triggerDeleteConversation('foo')) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('update conversation', () => {
    it('should call update conversation with passed conversation id and title then return consistent data', async () => {
      mockAgentFrameworkStorageService.updateConversation.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.updateConversation).not.toHaveBeenCalled();
      const result = (await triggerUpdateConversation(
        { conversationId: 'foo' },
        { title: 'new-title' }
      )) as ResponseObject;
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('client');
      expect(mockAgentFrameworkStorageService.updateConversation).toHaveBeenCalledWith(
        'foo',
        'new-title'
      );
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should call update conversation with passed data source id and title then get data source transport', async () => {
      mockAgentFrameworkStorageService.updateConversation.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.updateConversation).not.toHaveBeenCalled();
      const result = (await triggerUpdateConversation(
        { conversationId: 'foo' },
        { title: 'new-title' },
        'data_source_id'
      )) as ResponseObject;
      expect(mockAgentFrameworkStorageService.updateConversation).toHaveBeenCalledWith(
        'foo',
        'new-title'
      );
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('dataSource-client');
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should log error and return 500 error  when failed to update conversation', async () => {
      mockAgentFrameworkStorageService.updateConversation.mockRejectedValueOnce(new Error());

      const result = (await triggerUpdateConversation(
        { conversationId: 'foo' },
        { title: 'new-title' }
      )) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('get traces', () => {
    it('should call get traces with passed interaction id and return consistent data', async () => {
      const getTraceResultMock = [
        {
          interactionId: 'interaction-1',
          createTime: '',
          input: 'foo',
          output: 'bar',
          origin: '',
          traceNumber: 0,
        },
      ];
      mockAgentFrameworkStorageService.getTraces.mockResolvedValueOnce(getTraceResultMock);

      expect(mockAgentFrameworkStorageService.getTraces).not.toHaveBeenCalled();
      const result = (await triggerGetTrace('interaction-1')) as ResponseObject;
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('client');
      expect(mockAgentFrameworkStorageService.getTraces).toHaveBeenCalledWith('interaction-1');
      expect(result.source).toEqual(getTraceResultMock);
    });

    it('should call get traces with passed data source id and get data source transport', async () => {
      const getTraceResultMock = [
        {
          interactionId: 'interaction-1',
          createTime: '',
          input: 'foo',
          output: 'bar',
          origin: '',
          traceNumber: 0,
        },
      ];
      mockAgentFrameworkStorageService.getTraces.mockResolvedValueOnce(getTraceResultMock);

      expect(mockAgentFrameworkStorageService.getTraces).not.toHaveBeenCalled();
      const result = (await triggerGetTrace('interaction-1', 'data_source_id')) as ResponseObject;
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('dataSource-client');
      expect(mockAgentFrameworkStorageService.getTraces).toHaveBeenCalledWith('interaction-1');
      expect(result.source).toEqual(getTraceResultMock);
    });

    it('should log error and return 500 error when failed to get traces', async () => {
      mockAgentFrameworkStorageService.getTraces.mockRejectedValueOnce(new Error());

      const result = (await triggerGetTrace('interaction-1')) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('abort agent execution', () => {
    it('should call get abort agent with passed conversation id and call log info', async () => {
      expect(mockOllyChatService.abortAgentExecution).not.toHaveBeenCalled();

      await triggerAbortAgentExecution('foo');
      expect(mockOllyChatService.abortAgentExecution).toHaveBeenCalledWith('foo');
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('client');
      expect(mockedLogger.info).toHaveBeenCalledWith('Abort agent execution: foo');
    });

    it('should call get abort agent with passed data source id and get data source transport ', async () => {
      expect(mockOllyChatService.abortAgentExecution).not.toHaveBeenCalled();

      await triggerAbortAgentExecution('foo', 'data_source_id');
      expect(mockOllyChatService.abortAgentExecution).toHaveBeenCalledWith('foo');
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('dataSource-client');
      expect(mockedLogger.info).toHaveBeenCalledWith('Abort agent execution: foo');
    });

    it('should return 200 after abort success', async () => {
      const result = (await triggerAbortAgentExecution('foo')) as ResponseObject;
      expect(result.statusCode).toEqual(200);
    });

    it('should log error and return 500 error when failed to abort', async () => {
      mockOllyChatService.abortAgentExecution.mockImplementationOnce(() => {
        throw new Error();
      });

      const result = (await triggerAbortAgentExecution('foo')) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('feedback', () => {
    it('should call update interaction with passed interaction id and satisfaction then return consistent data', async () => {
      mockAgentFrameworkStorageService.updateConversation.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.updateConversation).not.toHaveBeenCalled();
      const result = (await triggerFeedback(
        { interactionId: 'foo' },
        { satisfaction: true }
      )) as ResponseObject;
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('client');
      expect(mockAgentFrameworkStorageService.updateInteraction).toHaveBeenCalledWith('foo', {
        feedback: {
          satisfaction: true,
        },
      });
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should call update interaction with passed data source id and get data source transport', async () => {
      mockAgentFrameworkStorageService.updateConversation.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.updateConversation).not.toHaveBeenCalled();
      const result = (await triggerFeedback(
        { interactionId: 'foo' },
        { satisfaction: true },
        'data_source_id'
      )) as ResponseObject;
      expect(getOpenSearchClientTransport.mock.results[0].value).toBe('dataSource-client');
      expect(mockAgentFrameworkStorageService.updateInteraction).toHaveBeenCalledWith('foo', {
        feedback: {
          satisfaction: true,
        },
      });
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should log error and return 500 error  when failed to feedback', async () => {
      mockAgentFrameworkStorageService.updateInteraction.mockRejectedValueOnce(new Error());

      const result = (await triggerFeedback(
        { interactionId: 'foo' },
        { satisfaction: true }
      )) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });
});
