/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { BufferMemory } from 'langchain/memory';
import { AgentFactory } from './agent_factory/agent_factory';

export const chatAgentInit = (pluginAgentTools: DynamicTool[], memory?: BufferMemory) => {
  const chatAgent = new AgentFactory('chat', pluginAgentTools, {}, memory);
  return chatAgent;
};
