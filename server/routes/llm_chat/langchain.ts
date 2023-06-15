/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  constructToolClients,
  destructToolsClients,
  initTools,
} from '../../langchain/tools/tools_helper';
import {
  ILegacyScopedClusterClient,
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../../src/core/server';
import { LANGCHAIN_API } from '../../../common/constants/llm';
import { chatAgentInit } from '../../langchain/agents/agent_helpers';
import { pluginAgentsInit } from '../../langchain/agents/plugin_agents/plugin_helpers';
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
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const { index, question } = request.body;
        const observabilityClient: ILegacyScopedClusterClient =
          // @ts-ignore https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4274
          context.observability_plugin.observabilityClient.asScoped(request);

        const pplTools = new PPLTools();
        pplTools.constructClients(
          context.core.opensearch.client.asCurrentUser,
          observabilityClient
        );
        const ppl = await pplTools.generatePPL(question, index);
        pplTools.destructClients();

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
        console.log('################## START CHAIN ###################');
        const { question } = request.body;
        const opensearchObservabilityClient: ILegacyScopedClusterClient =
          // @ts-ignore https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4274
          context.observability_plugin.observabilityClient.asScoped(request);
        const pluginTools = initTools();
        const pluginAgentTools = pluginAgentsInit(pluginTools);
        const chatAgent = chatAgentInit(pluginAgentTools);

        constructToolClients(
          context.core.opensearch.client.asCurrentUser,
          opensearchObservabilityClient,
          pluginTools
        );

        const agentResponse = await chatAgent.run(question);

        destructToolsClients(pluginTools);
        console.log('################## END CHAIN ###################');
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
