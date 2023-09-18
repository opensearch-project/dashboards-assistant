/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AgentExecutor,
  ChatAgent,
  ChatConversationalAgent,
  ChatConversationalCreatePromptArgs,
  ChatCreatePromptArgs,
  ZeroShotAgent,
} from 'langchain/agents';
import { BaseLanguageModel } from 'langchain/base_language';
import { Callbacks } from 'langchain/callbacks';
import { LLMChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import { DynamicTool } from 'langchain/tools';
import { ChatConversationalAgentOutputLenientParser } from '../output_parsers/output_parsers';
import { DEFAULT_HUMAN_MESSAGE, DEFAULT_SYSTEM_MESSAGE } from '../prompts/default_chat_prompts';
import {
  ZEROSHOT_CHAT_PREFIX,
  ZEROSHOT_CHAT_SUFFIX,
} from '../prompts/default_zeroshot_chat_prompts';
import {
  ZEROSHOT_HUMAN_PROMPT_TEMPLATE,
  ZEROSHOT_PROMPT_PREFIX,
  ZEROSHOT_PROMPT_SUFFIX,
} from '../prompts/default_zeroshot_prompt';

type AgentTypes = 'zeroshot' | 'chat' | 'chat-zeroshot';

interface AgentPrompts {
  /** String to put before the list of tools for a Zeroshot Agent */
  zeroshot_prompt_prefix?: string;
  /** String to put after the list of tools for a Zeroshot Agent */
  zeroshot_prompt_suffix?: string;
  /** String to put as human prompt template for a Zeroshot Agent */
  zeroshot_human_prompt?: string;
  /** String to put before the list of tools for a ReAct conversation Agent */
  chat_system_message?: string;
  /** String to put after the list of tools for a ReAct conversation Agent */
  chat_human_message?: string;
  /** String to put before the list of tools for a Zeroshot chat Agent */
  zeroshot_chat_prefix?: string;
  /** String to put after the list of tools for a Zeroshot chat Agent */
  zeroshot_chat_suffix?: string;
}

export class AgentFactory {
  agentTools: DynamicTool[] = [];
  model: BaseLanguageModel;
  executor: AgentExecutor;
  executorType: AgentTypes;
  agentArgs: AgentPrompts;
  memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
  });

  constructor(
    agentType: AgentTypes,
    agentTools: DynamicTool[],
    agentArgs: AgentPrompts,
    model: BaseLanguageModel,
    callbacks: Callbacks,
    customAgentMemory?: BufferMemory
  ) {
    this.executorType = agentType;
    this.model = model;
    this.agentTools = [...agentTools];
    this.agentArgs = agentArgs;

    switch (agentType) {
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
          callbacks,
          verbose: true,
        });
        break;
      }

      case 'chat-zeroshot': {
        const convArgs: ChatCreatePromptArgs = {
          prefix: this.agentArgs.zeroshot_chat_prefix ?? ZEROSHOT_CHAT_PREFIX,
          suffix: this.agentArgs.zeroshot_chat_suffix ?? ZEROSHOT_CHAT_SUFFIX,
        };
        this.executor = AgentExecutor.fromAgentAndTools({
          agent: ChatAgent.fromLLMAndTools(this.model, this.agentTools, convArgs),
          tools: this.agentTools,
          callbacks,
          verbose: true,
        });
        break;
      }

      case 'chat':
      default: {
        const toolNames = this.agentTools.map((tool) => tool.name);
        const baseParser = new ChatConversationalAgentOutputLenientParser({ toolNames });
        // TODO add retries to parser, ChatConversationalAgentOutputParserWithRetries seems not exported
        const convArgs: ChatConversationalCreatePromptArgs = {
          systemMessage: this.agentArgs.chat_system_message ?? DEFAULT_SYSTEM_MESSAGE,
          humanMessage: this.agentArgs.chat_human_message ?? DEFAULT_HUMAN_MESSAGE,
          outputParser: baseParser,
        };
        this.executor = AgentExecutor.fromAgentAndTools({
          agent: ChatConversationalAgent.fromLLMAndTools(this.model, this.agentTools, convArgs),
          tools: this.agentTools,
          memory: customAgentMemory ?? this.memory,
          callbacks,
          verbose: true,
        });
        break;
      }
    }
  }

  public run = async (question: string) => {
    const response =
      this.executorType === 'zeroshot'
        ? await this.executor.run(question)
        : await this.executor.call({ input: question });
    return response;
  };
}
