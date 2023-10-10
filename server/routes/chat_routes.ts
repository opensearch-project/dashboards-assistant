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
} from '../../../../src/core/server';
import { ASSISTANT_API } from '../../common/constants/llm';
import { CHAT_SAVED_OBJECT, IChat } from '../../common/types/chat_saved_object_attributes';
import { OllyChatService } from '../services/olly_chat_service';
import { SavedObjectsStorageService } from '../services/saved_objects_storage_service';

const llmRequestRoute = {
  path: ASSISTANT_API.LLM,
  validate: {
    body: schema.object({
      chatId: schema.maybe(schema.string()),
      messages: schema.maybe(schema.arrayOf(schema.any())),
      input: schema.object({
        type: schema.literal('input'),
        context: schema.object({
          appId: schema.maybe(schema.string()),
        }),
        content: schema.string(),
        contentType: schema.string(),
      }),
    }),
  },
};
export type LLMRequestSchema = TypeOf<typeof llmRequestRoute.validate.body>;

const getChatsRoute = {
  path: ASSISTANT_API.HISTORY,
  validate: {
    query: schema.object({
      perPage: schema.number({ min: 0, defaultValue: 20 }),
      page: schema.number({ min: 0, defaultValue: 1 }),
      sortOrder: schema.maybe(schema.string()),
      sortField: schema.maybe(schema.string()),
      fields: schema.maybe(schema.arrayOf(schema.string())),
    }),
  },
};
export type GetChatsSchema = TypeOf<typeof getChatsRoute.validate.query>;

export function registerChatRoutes(router: IRouter) {
  router.post(
    llmRequestRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const { chatId, input, messages = [] } = request.body;
      const storageService = new SavedObjectsStorageService(context.core.savedObjects.client);
      const chatService = new OllyChatService();

      // get history from the chat object for existing chats
      if (chatId && messages.length === 0) {
        try {
          const savedMessages = await storageService.getMessages(chatId);
          messages.push(...savedMessages);
        } catch (error) {
          return response.custom({ statusCode: error.statusCode || 500, body: error.message });
        }
      }

      try {
        const outputs = await chatService.requestLLM(messages, context, request);
        const saveMessagesResponse = await storageService.saveMessages(
          input.content.substring(0, 50),
          chatId,
          [...messages, input, ...outputs]
        );
        return response.ok({ body: saveMessagesResponse });
      } catch (error) {
        context.assistant_plugin.logger.warn(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.get(
    getChatsRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      try {
        const findResponse = await context.core.savedObjects.client.find<IChat>({
          ...request.query,
          type: CHAT_SAVED_OBJECT,
        });

        return response.ok({ body: findResponse });
      } catch (error) {
        context.assistant_plugin.logger.error(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );
}
