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
      conversationId: schema.maybe(schema.string()),
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
      rootAgentId: schema.string(),
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
  const createChatService = () => new OllyChatService();

  router.post(
    llmRequestRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const {
        messages = [],
        input,
        conversationId: conversationIdInRequestBody,
        rootAgentId,
      } = request.body;
      const storageService = createStorageService(context);
      const chatService = createChatService();

      try {
        const outputs = await chatService.requestLLM(
          { messages, input, conversationId: conversationIdInRequestBody, rootAgentId },
          context
        );
        const conversationId = outputs.memoryId;
        const finalMessage = await storageService.getConversation(conversationId);

        return response.ok({
          body: {
            messages: finalMessage.messages,
            conversationId: outputs.memoryId,
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
      const chatService = createChatService();

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
      const { conversationId, rootAgentId } = request.body;
      const storageService = createStorageService(context);
      let messages: IMessage[] = [];
      const chatService = createChatService();

      try {
        const conversation = await storageService.getConversation(conversationId);
        messages.push(...conversation.messages);
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
          { messages, input, conversationId, rootAgentId },
          context
        );
        const title = input.content.substring(0, 50);
        const saveMessagesResponse = await storageService.saveMessages(
          title,
          conversationId,
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
