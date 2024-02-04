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
      conversationId: schema.maybe(schema.string()),
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

const getConversationRoute = {
  path: `${ASSISTANT_API.CONVERSATION}/{conversationId}`,
  validate: {
    params: schema.object({
      conversationId: schema.string(),
    }),
  },
};
export type GetConversationSchema = TypeOf<typeof getConversationRoute.validate.params>;

const abortAgentExecutionRoute = {
  path: `${ASSISTANT_API.ABORT_AGENT_EXECUTION}`,
  validate: {
    body: schema.object({
      conversationId: schema.string(),
    }),
  },
};
export type AbortAgentExecutionSchema = TypeOf<typeof abortAgentExecutionRoute.validate.body>;

const regenerateRoute = {
  path: `${ASSISTANT_API.REGENERATE}`,
  validate: {
    body: schema.object({
      conversationId: schema.string(),
      interactionId: schema.string(),
    }),
  },
};
export type RegenerateSchema = TypeOf<typeof regenerateRoute.validate.body>;

const getConversationsRoute = {
  path: ASSISTANT_API.CONVERSATIONS,
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
export type GetConversationsSchema = TypeOf<typeof getConversationsRoute.validate.query>;

const deleteConversationRoute = {
  path: `${ASSISTANT_API.CONVERSATION}/{conversationId}`,
  validate: {
    params: schema.object({
      conversationId: schema.string(),
    }),
  },
};

const updateConversationRoute = {
  path: `${ASSISTANT_API.CONVERSATION}/{conversationId}`,
  validate: {
    params: schema.object({
      conversationId: schema.string(),
    }),
    body: schema.object({
      title: schema.string(),
    }),
  },
};

const getTracesRoute = {
  path: `${ASSISTANT_API.TRACE}/{interactionId}`,
  validate: {
    params: schema.object({
      interactionId: schema.string(),
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
  const createChatService = (context: RequestHandlerContext) => new OllyChatService(context);

  router.post(
    llmRequestRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const { messages = [], input, conversationId: conversationIdInRequestBody } = request.body;
      const storageService = createStorageService(context);
      const chatService = createChatService(context);

      let outputs: Awaited<ReturnType<ChatService['requestLLM']>> | undefined;

      /**
       * Get final answer from Agent framework
       */
      try {
        outputs = await chatService.requestLLM({
          messages,
          input,
          conversationId: conversationIdInRequestBody,
        });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }

      /**
       * Retrieve latest interactions from memory
       */
      const conversationId = outputs?.conversationId || (conversationIdInRequestBody as string);
      const interactionId = outputs?.interactionId || '';
      try {
        if (!conversationId) {
          throw new Error('Not a valid conversation');
        }

        const resultPayload: SendResponse = {
          messages: [],
          interactions: [],
          conversationId,
        };

        if (!conversationIdInRequestBody) {
          /**
           * If no conversationId is provided in request payload,
           * it means it is a brand new conversation,
           * need to fetch all the details including title.
           */
          const conversation = await storageService.getConversation(conversationId);
          resultPayload.interactions = conversation.interactions;
          resultPayload.messages = conversation.messages;
          resultPayload.title = conversation.title;
        } else {
          /**
           * Only response with the latest interaction.
           * It may have some issues in Concurrent case like a user may use two tabs to chat with Chatbot in one conversation.
           * But for now we will ignore this case, can be optimized by always fetching conversation if we need to take this case into consideration.
           */
          const interaction = await storageService.getInteraction(conversationId, interactionId);
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
    getConversationRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.getConversation(request.params.conversationId);
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.get(
    getConversationsRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.getConversations(request.query);
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.delete(
    deleteConversationRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.deleteConversation(request.params.conversationId);
        return response.ok({ body: getResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.put(
    updateConversationRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.updateConversation(
          request.params.conversationId,
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
        const getResponse = await storageService.getTraces(request.params.interactionId);
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
      const chatService = createChatService(context, '');
      try {
        chatService.abortAgentExecution(request.body.conversationId);
        context.assistant_plugin.logger.info(
          `Abort agent execution: ${request.body.conversationId}`
        );
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
      const { conversationId, interactionId } = request.body;
      const storageService = createStorageService(context);
      const chatService = createChatService(context);

      let outputs: Awaited<ReturnType<ChatService['regenerate']>> | undefined;

      /**
       * Get final answer from Agent framework
       */
      try {
        outputs = await chatService.regenerate({ conversationId, interactionId });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }

      /**
       * Retrieve latest interactions from memory
       */
      try {
        const interaction = await storageService.getInteraction(
          conversationId,
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
            conversationId,
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
