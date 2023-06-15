/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { PluginToolsFactory } from '../../tools/tools_factory/tools_factory';
import { extractContent } from '../../utils/data_model';
import { AgentFactory } from '../agent_factory/agent_factory';
import {
  PPL_AGENT_HUMAN_MESSAGE,
  PPL_AGENT_SYSTEM_MESSAGE,
} from '../prompts/plugin_agent_prompts/ppl_conv_prompts';

export const pluginAgentsInit = (PluginTools: PluginToolsFactory[]) => {
  const pplAgent = new AgentFactory('chat', PluginTools[0].toolsList, {});
  const alertingAgent = new AgentFactory('chat', PluginTools[1].toolsList, {});
  const knowledgeAgent = new AgentFactory('chat', PluginTools[2].toolsList, {});
  const opensearchAgent = new AgentFactory('chat', PluginTools[3].toolsList, {});

  const pluginAgentTools = [
    new DynamicTool({
      name: 'PPL Tools',
      description:
        'Use this tool to generate a generic PPL Query, prometheus PPL query or execute a PPL Query in an OpenSearch cluster. Takes natural language as input.',
      func: async (question: string) => {
        const response = await pplAgent.run(question);
        return extractContent(response);
      },
    }),
    new DynamicTool({
      name: 'Alerting Tools',
      description:
        'Use this tool to search alerting monitors by index or search all alerts in an OpenSearch cluster. Takes natural language as input.',
      func: async (question: string) => {
        const response = await alertingAgent.run(question);
        return extractContent(response);
      },
    }),
    new DynamicTool({
      name: 'Knowledge Tools',
      description:
        'Use this tool to get knowledge about PPL and Nginx information. Takes natural language as input.',
      func: async (question: string) => {
        const response = await knowledgeAgent.run(question);
        return extractContent(response);
      },
    }),
    new DynamicTool({
      name: 'OpenSearch Tools',
      description:
        'Use this tool to get information about opensearch index, datastreams or index aliases. Takes natural language as input.',
      func: async (question: string) => {
        const response = await opensearchAgent.run(question);
        return extractContent(response);
      },
    }),
  ];
  return pluginAgentTools;
};
