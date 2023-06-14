/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AgentExecutor,
  ChatConversationalAgent,
  ChatConversationalCreatePromptArgs,
} from 'langchain/agents';
import { BaseLanguageModel } from 'langchain/dist/base_language';
import { DynamicTool } from 'langchain/tools';
import { BufferMemory } from 'langchain/memory';
import { llmModel } from '../../models/llm_model';
import { OSAlertingTools } from '../../tools/aleritng_apis';
import { KnowledgeTools } from '../../tools/knowledges';
import { OSAPITools } from '../../tools/os_apis';
import {
  IScopedClusterClient,
  ILegacyScopedClusterClient,
} from '../../../../../../src/core/server';
import { PPLTools } from '../../tools/ppl';
import { ALERTING_SYSTEM_MESSAGE, ALERTING_HUMAN_MESSGAE } from '../alerting_conv_prompts';
import { DEFAULT_SYSTEM_MESSAGE, DEFAULT_HUMAN_MESSAGE } from '../default_chat_prompts';

type PluginAgentTypes = 'chat-alerting' | 'chat-ppl' | 'chat-opensearch';

export class PluginAgentFactory {
  agentTools: DynamicTool[] = [];
  model: BaseLanguageModel;
  executor?: AgentExecutor;
  executorType: PluginAgentTypes;
  osAPITools: OSAPITools;
  osAlertingTools: OSAlertingTools;
  pplTools: PPLTools;

  constructor(
    userScopedClient: IScopedClusterClient,
    OpenSearchObservabilityClient: ILegacyScopedClusterClient,
    agentType: PluginAgentTypes
  ) {
    this.executorType = agentType;
    this.model = llmModel.model;

    this.osAPITools = new OSAPITools(userScopedClient);
    this.osAlertingTools = new OSAlertingTools(OpenSearchObservabilityClient);
    this.pplTools = new PPLTools(userScopedClient.asCurrentUser, OpenSearchObservabilityClient);

    switch (agentType) {
      case 'chat-alerting': {
        this.agentTools = [...this.osAlertingTools.toolsList];
        break;
      }

      case 'chat-ppl': {
        this.agentTools = [...this.pplTools.toolsList];
        break;
      }

      case 'chat-opensearch':
      default: {
        this.agentTools = [...this.osAPITools.toolsList];
        break;
      }
    }
  }

  public async init() {
    switch (this.executorType) {
      case 'chat-alerting': {
        const memory = new BufferMemory({
          returnMessages: true,
          memoryKey: 'chat_history',
          inputKey: 'input',
        });
        const convArgs: ChatConversationalCreatePromptArgs = {
          systemMessage: ALERTING_SYSTEM_MESSAGE,
          humanMessage: ALERTING_HUMAN_MESSGAE,
        };
        this.executor = AgentExecutor.fromAgentAndTools({
          agent: ChatConversationalAgent.fromLLMAndTools(this.model, this.agentTools, convArgs),
          tools: this.agentTools,
          memory,
          verbose: true,
        });
        break;
      }

      case 'chat-opensearch':
      default: {
        const memory = new BufferMemory({
          returnMessages: true,
          memoryKey: 'chat_history',
          inputKey: 'input',
        });
        const convArgs: ChatConversationalCreatePromptArgs = {
          systemMessage: DEFAULT_SYSTEM_MESSAGE,
          humanMessage: DEFAULT_HUMAN_MESSAGE,
        };
        this.executor = AgentExecutor.fromAgentAndTools({
          agent: ChatConversationalAgent.fromLLMAndTools(this.model, this.agentTools, convArgs),
          tools: this.agentTools,
          memory,
          verbose: true,
        });
        break;
      }
    }
  }
}
