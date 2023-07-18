/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  HttpResponsePayload,
  ILegacyScopedClusterClient,
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../../src/core/server';
import { LANGCHAIN_API, LLM_INDEX } from '../../../common/constants/llm';
import { chatAgentInit } from '../../langchain/agents/agent_helpers';
import { pluginAgentsInit } from '../../langchain/agents/plugin_agents/plugin_helpers';
import { memoryInit } from '../../langchain/memory/chat_agent_memory';
import { initTools } from '../../langchain/tools/tools_helper';
import { PPLTools } from '../../langchain/tools/tool_sets/ppl';

export function registerLangChainRoutes(router: IRouter) {
  router.post(
    {
      path: LANGCHAIN_API.PPL_GENERATOR,
      validate: {
        body: schema.object({
          index: schema.string(),
          question: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      try {
        const { index, question } = request.body;
        const observabilityClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
          request
        );

        const pplTools = new PPLTools(
          context.core.opensearch.client.asCurrentUser,
          observabilityClient
        );
        const ppl = await pplTools.generatePPL(question, index);

        return response.ok({ body: ppl });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: LANGCHAIN_API.AGENT_TEST,
      validate: {
        body: schema.object({
          question: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      try {
        const { question } = request.body;
        const opensearchObservabilityClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
          request
        );
        console.log('########### START CHAIN ####################');
        // const pluginTools = initTools(
        //   context.core.opensearch.client.asCurrentUser,
        //   opensearchObservabilityClient
        // );
        // const pluginAgentTools = pluginAgentsInit(pluginTools);
        // const memory = memoryInit([]);
        // const chatAgent = chatAgentInit(pluginAgentTools, memory);
        // const agentResponse = await chatAgent.run(question);
        // const agentResponse = await pluginTools[0].generatePPL(question);

        const {
          body: { hits },
        } = await context.core.opensearch.client.asCurrentUser.search({
          index: 'olly-chat-config',
        });

        const mlCommonsModelId = hits.hits[0]._source.model_id;

        const mlCommonsResponse = await context.core.opensearch.client.asCurrentUser.transport.request(
          {
            method: 'POST',
            path: `/_plugins/_ml/models/${mlCommonsModelId}/_predict`,
            body: {
              parameters: {
                prompt: question,
              },
            },
          }
        );
        console.log('########### END CHAIN ####################');
        return response.ok({ body: mlCommonsResponse });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: LANGCHAIN_API.FEEDBACK,
      validate: {
        body: schema.object({
          metadata: schema.object({
            type: schema.string(),
            chatId: schema.maybe(schema.string()),
            sessionId: schema.maybe(schema.string()),
            error: schema.maybe(schema.boolean()),
            selectedIndex: schema.maybe(schema.string()),
          }),
          input: schema.string(),
          output: schema.string(),
          correct: schema.boolean(),
          expectedOutput: schema.string(),
          comment: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      try {
        await context.core.opensearch.client.asCurrentUser.index({
          index: LLM_INDEX.FEEDBACK,
          body: { ...request.body, timestamp: new Date().toISOString() },
        });

        return response.ok();
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
