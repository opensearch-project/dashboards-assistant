/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { BufferMemory } from 'langchain/memory';
import { AgentFactory } from './agent_factory/agent_factory';
import {
  PARENT_AGENT_SYSTEM_MESSAGE,
  PARENT_AGENT_HUMAN_MESSAGE,
} from './prompts/parent_agent_prompts';

export const chatAgentInit = (pluginAgentTools: DynamicTool[], memory?: BufferMemory) => {
  const chatAgent = new AgentFactory(
    'chat',
    pluginAgentTools,
    {
      chat_system_message: PARENT_AGENT_SYSTEM_MESSAGE,
      chat_human_message: PARENT_AGENT_HUMAN_MESSAGE,
    },
    memory
  );
  return chatAgent;
};
