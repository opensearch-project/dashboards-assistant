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

const triggerDeleteSession = (sessionId: string) =>
  triggerHandler(router, {
    method: 'delete',
    path: `${ASSISTANT_API.SESSION}/{sessionId}`,
    req: httpServerMock.createRawRequest({ params: { sessionId } }),
  });
const triggerUpdateSession = (params: { sessionId: string }, payload: { title: string }) =>
  triggerHandler(router, {
    method: 'put',
    path: `${ASSISTANT_API.SESSION}/{sessionId}`,
    req: httpServerMock.createRawRequest({ params, payload }),
  });
const triggerGetTrace = (traceId: string) =>
  triggerHandler(router, {
    method: 'get',
    path: `${ASSISTANT_API.TRACE}/{traceId}`,
    req: httpServerMock.createRawRequest({ params: { traceId } }),
  });
const triggerAbortAgentExecution = (sessionId: string) =>
  triggerHandler(router, {
    method: 'post',
    path: ASSISTANT_API.ABORT_AGENT_EXECUTION,
    req: httpServerMock.createRawRequest({ payload: { sessionId } }),
  });
const triggerFeedback = (params: { interactionId: string }, payload: { satisfaction: boolean }) =>
  triggerHandler(router, {
    method: 'put',
    path: `${ASSISTANT_API.FEEDBACK}/{interactionId}`,
    req: httpServerMock.createRawRequest({ params, payload }),
  });

describe('chat routes', () => {
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('delete session', () => {
    it('should call delete session with passed session id and return consistent data', async () => {
      mockAgentFrameworkStorageService.deleteSession.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.deleteSession).not.toHaveBeenCalled();
      const result = (await triggerDeleteSession('foo')) as ResponseObject;
      expect(mockAgentFrameworkStorageService.deleteSession).toHaveBeenCalledWith('foo');
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should log error and return 500 error', async () => {
      mockAgentFrameworkStorageService.deleteSession.mockRejectedValueOnce(new Error());

      const result = (await triggerDeleteSession('foo')) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('update session', () => {
    it('should call update session with passed session id and title then return consistent data', async () => {
      mockAgentFrameworkStorageService.updateSession.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.updateSession).not.toHaveBeenCalled();
      const result = (await triggerUpdateSession(
        { sessionId: 'foo' },
        { title: 'new-title' }
      )) as ResponseObject;
      expect(mockAgentFrameworkStorageService.updateSession).toHaveBeenCalledWith(
        'foo',
        'new-title'
      );
      expect(result.source).toMatchInlineSnapshot(`
        Object {
          "success": true,
        }
      `);
    });

    it('should log error and return 500 error  when failed to update session', async () => {
      mockAgentFrameworkStorageService.updateSession.mockRejectedValueOnce(new Error());

      const result = (await triggerUpdateSession(
        { sessionId: 'foo' },
        { title: 'new-title' }
      )) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('get traces', () => {
    it('should call get traces with passed trace id and return consistent data', async () => {
      const getTraceResultMock = [
        {
          interactionId: 'interaction-1',
          parentInteractionId: '',
          createTime: '',
          input: 'foo',
          output: 'bar',
          origin: '',
          traceNumber: 0,
        },
      ];
      mockAgentFrameworkStorageService.getTraces.mockResolvedValueOnce(getTraceResultMock);

      expect(mockAgentFrameworkStorageService.getTraces).not.toHaveBeenCalled();
      const result = (await triggerGetTrace('trace-1')) as ResponseObject;
      expect(mockAgentFrameworkStorageService.getTraces).toHaveBeenCalledWith('trace-1');
      expect(result.source).toEqual(getTraceResultMock);
    });

    it('should log error and return 500 error when failed to get traces', async () => {
      mockAgentFrameworkStorageService.getTraces.mockRejectedValueOnce(new Error());

      const result = (await triggerGetTrace('trace-1')) as Boom;

      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error));
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('abort agent execution', () => {
    it('should call get abort agent with passed session id and call log info', async () => {
      expect(mockOllyChatService.abortAgentExecution).not.toHaveBeenCalled();

      await triggerAbortAgentExecution('foo');
      expect(mockOllyChatService.abortAgentExecution).toHaveBeenCalledWith('foo');
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
      mockAgentFrameworkStorageService.updateSession.mockResolvedValueOnce({
        success: true,
      });

      expect(mockAgentFrameworkStorageService.updateSession).not.toHaveBeenCalled();
      const result = (await triggerFeedback(
        { interactionId: 'foo' },
        { satisfaction: true }
      )) as ResponseObject;
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
