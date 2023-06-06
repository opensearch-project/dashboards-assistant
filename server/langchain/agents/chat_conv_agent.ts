import { LLMChain } from 'langchain/chains';
import { ZeroShotAgent, AgentExecutor } from 'langchain/agents';
import { DynamicTool } from 'langchain/tools';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from 'langchain/prompts';
import { BaseLanguageModel } from 'langchain/dist/base_language';
import { OSAPITools } from '../tools/os_apis';
import { IScopedClusterClient } from '../../../../../src/core/server/opensearch/client';
import { llmModel } from '../models/llm_model';
import {
  ZEROSHOT_HUMAN_PROMPT_TEMPLATE,
  ZEROSHOT_PROMPT_PREFIX,
  ZEROSHOT_PROMPT_SUFFIX,
} from './zeroshot_agent_prompt';

export class AgentFactory {
  osAPITools: OSAPITools;
  agentTools: DynamicTool[] = [];
  model: BaseLanguageModel;
  executor: AgentExecutor | undefined = undefined;

  constructor(userScopedClient: IScopedClusterClient) {
    this.osAPITools = new OSAPITools(userScopedClient);
    this.model = llmModel.model;
    this.agentTools = this.osAPITools.toolsList;
  }

  public init() {
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
  }

  public run = async (question: string) => {
    const response = await this.executor?.run(question);
    return response;
  };
}
