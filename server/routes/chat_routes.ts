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
import { SavedObjectsStorageService } from '../services/storage/saved_objects_storage_service';

const llmRequestRoute = {
  path: ASSISTANT_API.SEND_MESSAGE,
  validate: {
    body: schema.object({
      sessionID: schema.maybe(schema.string()),
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

const getSessionRoute = {
  path: `${ASSISTANT_API.SESSION}/{sessionID}`,
  validate: {
    params: schema.object({
      sessionID: schema.string(),
    }),
  },
};
export type GetSessionSchema = TypeOf<typeof getSessionRoute.validate.params>;

const getSessionsRoute = {
  path: ASSISTANT_API.SESSIONS,
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
export type GetSessionsSchema = TypeOf<typeof getSessionsRoute.validate.query>;

export function registerChatRoutes(router: IRouter) {
  const createStorageService = (context: RequestHandlerContext) =>
    new SavedObjectsStorageService(context.core.savedObjects.client);
  const createChatService = () => new OllyChatService();

  router.post(
    llmRequestRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const { sessionID, input, messages = [] } = request.body;
      const storageService = createStorageService(context);
      const chatService = createChatService();

      // get history from the chat object for existing chats
      if (sessionID && messages.length === 0) {
        try {
          const session = await storageService.getSession(sessionID);
          messages.push(...session.messages);
        } catch (error) {
          return response.custom({ statusCode: error.statusCode || 500, body: error.message });
        }
      }

      try {
        const outputs = await chatService.requestLLM(messages, context, request);
        const saveMessagesResponse = await storageService.saveMessages(
          input.content.substring(0, 50),
          sessionID,
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
    getSessionRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const storageService = createStorageService(context);

      try {
        const getResponse = await storageService.getSession(request.params.sessionID);
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
}
