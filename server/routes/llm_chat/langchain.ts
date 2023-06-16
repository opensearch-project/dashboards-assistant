/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  ILegacyScopedClusterClient,
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../../src/core/server';
import { LANGCHAIN_API } from '../../../common/constants/llm';
import { chatAgentInit } from '../../langchain/agents/agent_helpers';
import { pluginAgentsInit } from '../../langchain/agents/plugin_agents/plugin_helpers';
import { initTools } from '../../langchain/tools/tools_helper';
import { PPLTools } from '../../langchain/tools/tool_sets/ppl';
import { memoryInit } from '../../langchain/memory/chat_agent_memory';

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
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
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
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const { question } = request.body;
        const opensearchObservabilityClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
          request
        );
        console.log('########### START CHAIN ####################');
        const pluginTools = initTools(
          context.core.opensearch.client.asCurrentUser,
          opensearchObservabilityClient
        );
        const pluginAgentTools = pluginAgentsInit(pluginTools);
        const memory = memoryInit([]);
        const chatAgent = chatAgentInit(pluginAgentTools, memory);
        const agentResponse = await chatAgent.run(question);
        // const agentResponse = await pluginTools[0].generatePPL(question);
        console.log('########### END CHAIN ####################');
        return response.ok({ body: agentResponse });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
