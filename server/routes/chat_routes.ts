/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { schema, TypeOf } from '@osd/config-schema';
import {
  HttpResponsePayload,
  IOpenSearchDashboardsResponse,
  IRouter,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { ASSISTANT_API } from '../../common/constants/llm';
import { OllyChatService } from '../services/chat/olly_chat_service';
import { IMessage, IInput } from '../../common/types/chat_saved_object_attributes';
import { AgentFrameworkStorageService } from '../services/storage/agent_framework_storage_service';
import { RoutesOptions } from '../types';

const llmRequestRoute = {
  path: ASSISTANT_API.SEND_MESSAGE,
  validate: {
    body: schema.object({
      sessionId: schema.maybe(schema.string()),
      messages: schema.maybe(schema.arrayOf(schema.any())),
      rootAgentId: schema.string(),
      input: schema.object({
        type: schema.literal('input'),
        context: schema.object({
          appId: schema.maybe(schema.string()),
        }),
        content: schema.string(),
        contentType: schema.literal('text'),
      }),
    }),
  },
};
export type LLMRequestSchema = TypeOf<typeof llmRequestRoute.validate.body>;

const getSessionRoute = {
  path: `${ASSISTANT_API.SESSION}/{sessionId}`,
  validate: {
    params: schema.object({
      sessionId: schema.string(),
    }),
  },
};
export type GetSessionSchema = TypeOf<typeof getSessionRoute.validate.params>;

const abortAgentExecutionRoute = {
  path: `${ASSISTANT_API.ABORT_AGENT_EXECUTION}`,
  validate: {
    body: schema.object({
      sessionId: schema.string(),
    }),
  },
};
export type AbortAgentExecutionSchema = TypeOf<typeof abortAgentExecutionRoute.validate.body>;

const regenerateRoute = {
  path: `${ASSISTANT_API.REGENERATE}`,
  validate: {
    body: schema.object({
      sessionId: schema.string(),
      rootAgentId: schema.string(),
    }),
  },
};
export type RegenerateSchema = TypeOf<typeof regenerateRoute.validate.body>;

const getSessionsRoute = {
  path: ASSISTANT_API.SESSIONS,
  validate: {
    query: schema.object({
      perPage: schema.number({ min: 0, defaultValue: 20 }),
      page: schema.number({ min: 0, defaultValue: 1 }),
      sortOrder: schema.maybe(schema.string()),
      sortField: schema.maybe(schema.string()),
      fields: schema.maybe(schema.arrayOf(schema.string())),
      search: schema.maybe(schema.string()),
      searchFields: schema.maybe(schema.oneOf([schema.string(), schema.arrayOf(schema.string())])),
    }),
  },
};
export type GetSessionsSchema = TypeOf<typeof getSessionsRoute.validate.query>;

const deleteSessionRoute = {
  path: `${ASSISTANT_API.SESSION}/{sessionId}`,
  validate: {
    params: schema.object({
      sessionId: schema.string(),
    }),
  },
};

const updateSessionRoute = {
  path: `${ASSISTANT_API.SESSION}/{sessionId}`,
  validate: {
    params: schema.object({
      sessionId: schema.string(),
    }),
    body: schema.object({
      title: schema.string(),
    }),
  },
};

const getTracesRoute = {
  path: `${ASSISTANT_API.TRACE}/{traceId}`,
  validate: {
    params: schema.object({
      traceId: schema.string(),
    }),
  },
};

export function registerChatRoutes(router: IRouter, routeOptions: RoutesOptions) {
  const createStorageService = (context: RequestHandlerContext) =>
    new AgentFrameworkStorageService(
      context.core.opensearch.client.asCurrentUser,
      routeOptions.messageParsers
    );
  const createChatService = () => new OllyChatService();

  router.post(
    llmRequestRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const { messages = [], input, sessionId: sessionIdInRequestBody, rootAgentId } = request.body;
      const storageService = createStorageService(context);
      const chatService = createChatService();

      try {
        const outputs = await chatService.requestLLM(
          { messages, input, sessionId: sessionIdInRequestBody, rootAgentId },
          context
        );
        const sessionId = outputs.memoryId;
        const finalMessage = await storageService.getSession(sessionId);

        return response.ok({
          body: {
            messages: finalMessage.messages,
            sessionId: outputs.memoryId,
            title: finalMessage.title,
            interactions: finalMessage.interactions,
          },
        });
      } catch (error) {
        context.assistant_plugin.logger.warn(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.get(
    getSessionRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.getSession(request.params.sessionId);
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.get(
    getSessionsRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.getSessions(request.query);
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.delete(
    deleteSessionRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.deleteSession(request.params.sessionId);
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.put(
    updateSessionRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.updateSession(
          request.params.sessionId,
          request.body.title
        );
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.get(
    getTracesRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.getTraces(request.params.traceId);
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.post(
    abortAgentExecutionRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const chatService = createChatService();

      try {
        chatService.abortAgentExecution(request.body.sessionId);
        context.assistant_plugin.logger.info(`Abort agent execution: ${request.body.sessionId}`);
        return response.ok();
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.put(
    regenerateRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const { sessionId, rootAgentId } = request.body;
      const storageService = createStorageService(context);
      let messages: IMessage[] = [];
      const chatService = createChatService();

      try {
        const session = await storageService.getSession(sessionId);
        messages.push(...session.messages);
      } catch (error) {
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }

      const lastInputIndex = messages.findLastIndex((msg) => msg.type === 'input');
      // Find last input message
      const input = messages[lastInputIndex] as IInput;
      // Take the messages before last input message as memory as regenerate will exclude the last outputs
      messages = messages.slice(0, lastInputIndex);

      try {
        const outputs = await chatService.requestLLM(
          { messages, input, sessionId, rootAgentId },
          context
        );
        const title = input.content.substring(0, 50);
        const saveMessagesResponse = await storageService.saveMessages(
          title,
          sessionId,
          [...messages, input, ...outputs.messages].filter(
            (message) => message.content !== 'AbortError'
          )
        );
        return response.ok({
          body: { ...saveMessagesResponse, title },
        });
      } catch (error) {
        context.assistant_plugin.logger.warn(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );
}
