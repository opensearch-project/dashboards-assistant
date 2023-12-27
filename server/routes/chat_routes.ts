/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { schema, TypeOf } from '@osd/config-schema';
import { SendResponse } from 'common/types/chat_saved_object_attributes';
import {
  HttpResponsePayload,
  IOpenSearchDashboardsResponse,
  IRouter,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { ASSISTANT_API } from '../../common/constants/llm';
import { OllyChatService } from '../services/chat/olly_chat_service';
import { AgentFrameworkStorageService } from '../services/storage/agent_framework_storage_service';
import { RoutesOptions } from '../types';
import { ChatService } from '../services/chat/chat_service';

const llmRequestRoute = {
  path: ASSISTANT_API.SEND_MESSAGE,
  validate: {
    body: schema.object({
      sessionId: schema.maybe(schema.string()),
      messages: schema.maybe(schema.arrayOf(schema.any())),
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

export const AgentIdNotFoundError =
  'rootAgentId is required, please specify one in opensearch_dashboards.yml';

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
      interactionId: schema.string(),
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

const feedbackRoute = {
  path: `${ASSISTANT_API.FEEDBACK}/{interactionId}`,
  validate: {
    params: schema.object({
      interactionId: schema.string(),
    }),
    body: schema.object({
      satisfaction: schema.boolean(),
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
      if (!routeOptions.rootAgentId) {
        context.assistant_plugin.logger.error(AgentIdNotFoundError);
        return response.custom({ statusCode: 400, body: AgentIdNotFoundError });
      }
      const { messages = [], input, sessionId: sessionIdInRequestBody } = request.body;
      const storageService = createStorageService(context);
      const chatService = createChatService();

      let outputs: Awaited<ReturnType<ChatService['requestLLM']>> | undefined;

      /**
       * Get final answer from Agent framework
       */
      try {
        outputs = await chatService.requestLLM(
          {
            messages,
            input,
            sessionId: sessionIdInRequestBody,
            rootAgentId: routeOptions.rootAgentId,
          },
          context
        );
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        const sessionId = outputs?.memoryId || sessionIdInRequestBody;
        if (!sessionId) {
          return response.custom({ statusCode: error.statusCode || 500, body: error.message });
        }
      }

      /**
       * Retrieve latest interactions from memory
       */
      const sessionId = outputs?.memoryId || (sessionIdInRequestBody as string);
      const interactionId = outputs?.interactionId || '';
      try {
        if (!sessionId) {
          throw new Error('Not a valid conversation');
        }

        const resultPayload: SendResponse = {
          messages: [],
          interactions: [],
          sessionId,
        };

        if (!sessionIdInRequestBody) {
          /**
           * If no sessionId is provided in request payload,
           * it means it is a brand new conversation,
           * need to fetch all the details including title.
           */
          const conversation = await storageService.getSession(sessionId);
          resultPayload.interactions = conversation.interactions;
          resultPayload.messages = conversation.messages;
          resultPayload.title = conversation.title;
        } else {
          /**
           * Only response with the latest interaction.
           * It may have some issues in Concurrent case like a user may use two tabs to chat with Chatbot in one conversation.
           * But for now we will ignore this case, can be optimized by always fetching conversation if we need to take this case into consideration.
           */
          const interaction = await storageService.getInteraction(sessionId, interactionId);
          resultPayload.interactions = [interaction].filter((item) => item);
          resultPayload.messages = resultPayload.interactions.length
            ? await storageService.getMessagesFromInteractions(resultPayload.interactions)
            : [];
        }

        return response.ok({
          body: resultPayload,
        });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
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
      if (!routeOptions.rootAgentId) {
        context.assistant_plugin.logger.error(AgentIdNotFoundError);
        return response.custom({ statusCode: 400, body: AgentIdNotFoundError });
      }
      const { sessionId, interactionId } = request.body;
      const storageService = createStorageService(context);
      const chatService = createChatService();

      let outputs: Awaited<ReturnType<ChatService['regenerate']>> | undefined;

      /**
       * Get final answer from Agent framework
       */
      try {
        outputs = await chatService.regenerate(
          { sessionId, rootAgentId: routeOptions.rootAgentId, interactionId },
          context
        );
      } catch (error) {
        context.assistant_plugin.logger.error(error);
      }

      /**
       * Retrieve latest interactions from memory
       */
      try {
        const interaction = await storageService.getInteraction(
          sessionId,
          outputs?.interactionId || ''
        );
        const finalInteractions = [interaction].filter((item) => item);
        const messages = finalInteractions.length
          ? await storageService.getMessagesFromInteractions(finalInteractions)
          : [];

        return response.ok({
          body: {
            interactions: finalInteractions,
            messages,
            sessionId,
          },
        });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.put(
    feedbackRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);
      const { interactionId } = request.params;

      try {
        const updateResponse = await storageService.updateInteraction(interactionId, {
          feedback: request.body,
        });
        return response.ok({ body: { ...updateResponse, success: true } });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
