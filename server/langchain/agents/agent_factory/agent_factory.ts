/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AgentExecutor,
  ZeroShotAgent,
  ChatConversationalCreatePromptArgs,
  ChatConversationalAgent,
} from 'langchain/agents';
import { LLMChain } from 'langchain/dist';
import { BaseLanguageModel } from 'langchain/dist/base_language';
import { BufferMemory } from 'langchain/memory';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from 'langchain/prompts';
import { DynamicTool } from 'langchain/tools';
import { llmModel } from '../../models/llm_model';
import { DEFAULT_SYSTEM_MESSAGE, DEFAULT_HUMAN_MESSAGE } from '../default_chat_prompts';
import {
  ZEROSHOT_PROMPT_PREFIX,
  ZEROSHOT_PROMPT_SUFFIX,
  ZEROSHOT_HUMAN_PROMPT_TEMPLATE,
} from '../zeroshot_agent_prompt';

type AgentTypes = 'zeroshot' | 'chat';

interface AgentPrompts {
  /** String to put before the list of tools for a Zero Shot Agent */
  zeroshot_prompt_prefix?: string;
  /** String to put after the list of tools for a Zero Shot Agent */
  zeroshot_prompt_suffix?: string;
  /** String to put as human prompt template for a Zero Shot Agent */
  zeroshot_human_prompt?: string;
  /** String to put before the list of tools for a ReAct conversation Agent */
  default_system_message?: string;
  /** String to put after the list of tools for a ReAct conversation Agent */
  default_human_message?: string;
}

export class AgentFactory {
  agentTools: DynamicTool[] = [];
  model: BaseLanguageModel;
  executor?: AgentExecutor;
  executorType: AgentTypes;
  agentArgs: AgentPrompts;
  memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
  });

  constructor(agentType: AgentTypes, agentTools: DynamicTool[], agentArgs: AgentPrompts) {
    this.executorType = agentType;
    this.model = llmModel.model;
    this.agentTools = [...agentTools];
    this.agentArgs = agentArgs;
  }

  public async init(customAgentMemory?: BufferMemory) {
    switch (this.executorType) {
      case 'zeroshot': {
        const prompt = ZeroShotAgent.createPrompt(this.agentTools, {
          prefix: this.agentArgs.zeroshot_prompt_prefix ?? ZEROSHOT_PROMPT_PREFIX,
          suffix: this.agentArgs.zeroshot_prompt_suffix ?? ZEROSHOT_PROMPT_SUFFIX,
        });
        const chatPrompt = ChatPromptTemplate.fromPromptMessages([
          new SystemMessagePromptTemplate(prompt),
          HumanMessagePromptTemplate.fromTemplate(
            this.agentArgs.zeroshot_human_prompt ?? ZEROSHOT_HUMAN_PROMPT_TEMPLATE
          ),
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
      }

      case 'chat':
      default: {
        const convArgs: ChatConversationalCreatePromptArgs = {
          systemMessage: this.agentArgs.default_system_message ?? DEFAULT_SYSTEM_MESSAGE,
          humanMessage: this.agentArgs.default_human_message ?? DEFAULT_HUMAN_MESSAGE,
        };
        this.executor = AgentExecutor.fromAgentAndTools({
          agent: ChatConversationalAgent.fromLLMAndTools(this.model, this.agentTools, convArgs),
          tools: this.agentTools,
          memory: customAgentMemory ?? this.memory,
          verbose: true,
        });
        break;
      }
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
