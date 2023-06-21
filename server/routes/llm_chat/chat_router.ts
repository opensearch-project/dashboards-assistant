/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { schema } from '@osd/config-schema';
import { v4 as uuid } from 'uuid';
import {
  ILegacyScopedClusterClient,
  IOpenSearchDashboardsResponse,
  IRouter,
} from '../../../../../src/core/server';
import { CHAT_API } from '../../../common/constants/llm';
import {
  CHAT_SAVED_OBJECT,
  IChat,
  SAVED_OBJECT_VERSION,
} from '../../../common/types/observability_saved_object_attributes';
import { chatAgentInit } from '../../langchain/agents/agent_helpers';
import { pluginAgentsInit } from '../../langchain/agents/plugin_agents/plugin_helpers';
import { memoryInit } from '../../langchain/memory/chat_agent_memory';
import { initTools } from '../../langchain/tools/tools_helper';
import { convertToOutputs } from '../../langchain/utils/data_model';
import { getTraceBySessionId } from '../../langchain/utils/session_trace';

export function registerChatRoute(router: IRouter) {
  // TODO split into three functions: request LLM, create chat, update chat
  router.post(
    {
      path: CHAT_API.LLM,
      validate: {
        body: schema.object({
          chatId: schema.maybe(schema.string()),
          // TODO finish schema, messages should be retrieved from index
          messages: schema.arrayOf(schema.any()),
          input: schema.object({
            type: schema.string(),
            context: schema.object({
              appId: schema.maybe(schema.string()),
            }),
            content: schema.string(),
            contentType: schema.string(),
          }),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const client = context.core.savedObjects.client;
        const { chatId, input, messages } = request.body;
        const sessionId = uuid();
        const opensearchObservabilityClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
          request
        );

        // FIXME this sets a unique langchain session id for each message but does not support concurrency
        process.env.LANGCHAIN_SESSION = sessionId;
        const pluginTools = initTools(
          context.core.opensearch.client.asCurrentUser,
          opensearchObservabilityClient
        );
        const pluginAgentTools = pluginAgentsInit(pluginTools);
        const memory = memoryInit(messages.slice(1)); // Skips the first default message

        const chatAgentWithPluginAgentTools = chatAgentInit(pluginAgentTools, memory);
        const chatAgentWithFlattenedTools = chatAgentInit(
          pluginTools.flatMap((tool) => tool.toolsList),
          memory
        );
        const chatAgentWithPPLTools = chatAgentInit(pluginTools[0].toolsList, memory);

        const chatAgent = chatAgentWithFlattenedTools;

        const agentResponse = await chatAgent.run(input.content);
        process.env.LANGCHAIN_SESSION = undefined;

        const outputs = convertToOutputs(agentResponse, sessionId);

        if (!chatId) {
          const createResponse = await client.create<IChat>(CHAT_SAVED_OBJECT, {
            title: input.content.substring(0, 50),
            version: SAVED_OBJECT_VERSION,
            createdTimeMs: new Date().getTime(),
            messages: [...messages, input, ...outputs],
          });
          return response.ok({
            body: {
              chatId: createResponse.id,
              messages: createResponse.attributes.messages,
            },
          });
        }
        const updateResponse = await client.update<Partial<IChat>>(CHAT_SAVED_OBJECT, chatId, {
          messages: [...messages, input, ...outputs],
        });
        return response.ok({
          body: {
            chatId,
            messages: updateResponse.attributes.messages,
          },
        });
      } catch (error) {
        console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
