/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentExecutor, initializeAgentExecutorWithOptions, ZeroShotAgent } from 'langchain/agents';
import { LLMChain } from 'langchain/chains';
import { BaseLanguageModel } from 'langchain/dist/base_language';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import { DynamicTool } from 'langchain/tools';
import { IScopedClusterClient } from '../../../../../src/core/server/opensearch/client';
import { llmModel } from '../models/llm_model';
import { KnowledgeTools } from '../tools/knowledges';
import { OSAPITools } from '../tools/os_apis';
import {
  ZEROSHOT_HUMAN_PROMPT_TEMPLATE,
  ZEROSHOT_PROMPT_PREFIX,
  ZEROSHOT_PROMPT_SUFFIX,
} from './zeroshot_agent_prompt';
import { ILegacyScopedClusterClient } from '../../../../../src/core/server';
import { OSAlertingTools } from '../tools/aleritng_apis';

type AgentTypes = 'zeroshot' | 'chat';

export class AgentFactory {
  osAPITools: OSAPITools;
  osAlertingTools: OSAlertingTools;
  agentTools: DynamicTool[] = [];
  model: BaseLanguageModel;
  executor?: AgentExecutor;
  executorType?: AgentTypes;

  constructor(
    userScopedClient: IScopedClusterClient,
    OpenSearchObservabilityClient: ILegacyScopedClusterClient
  ) {
    this.model = llmModel.model;
    this.osAPITools = new OSAPITools(userScopedClient);
    this.osAlertingTools = new OSAlertingTools(OpenSearchObservabilityClient);
    this.agentTools = [
      ...this.osAPITools.toolsList,
      ...this.osAlertingTools.toolsList,
      ...new KnowledgeTools(userScopedClient.asCurrentUser).toolsList,
    ];
  }

  public async init(agentType: AgentTypes = 'chat') {
    this.executorType = agentType;
    switch (agentType) {
      case 'zeroshot':
        const prompt = ZeroShotAgent.createPrompt(this.agentTools, {
          prefix: ZEROSHOT_PROMPT_PREFIX,
          suffix: ZEROSHOT_PROMPT_SUFFIX,
        });
        const chatPrompt = ChatPromptTemplate.fromPromptMessages([
          new SystemMessagePromptTemplate(prompt),
          HumanMessagePromptTemplate.fromTemplate(ZEROSHOT_HUMAN_PROMPT_TEMPLATE),
        ]);
        const llmChain = new LLMChain({
          prompt: chatPrompt,
          llm: this.model,
        });
        const agent = new ZeroShotAgent({
          llmChain,
          allowedTools: this.agentTools.map((tool) => tool.name),
        });
        this.executor = AgentExecutor.fromAgentAndTools({
          agent,
          tools: this.agentTools,
          verbose: true,
        });
        break;

      case 'chat':
      default:
        this.executor = await initializeAgentExecutorWithOptions(this.agentTools, this.model, {
          agentType: 'chat-conversational-react-description',
          verbose: true,
        });
        break;
    }
  }

  public run = async (question: string) => {
    if (!this.executor) {
      throw new Error('Agent executor not initialized.');
    }
    const response =
      this.executorType === 'zeroshot'
        ? await this.executor.run(question)
        : await this.executor.call({ input: question });
    return response;
  };
}
