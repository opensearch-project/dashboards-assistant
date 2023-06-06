import { LLMChain } from 'langchain/chains';
import { ZeroShotAgent, AgentExecutor, initializeAgentExecutorWithOptions } from 'langchain/agents';
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

type AgentTypes = 'zeroshot' | 'chat';

export class AgentFactory {
  osAPITools: OSAPITools;
  agentTools: DynamicTool[] = [];
  model: BaseLanguageModel;
  executor: AgentExecutor | undefined = undefined;
  executorType: AgentTypes | undefined = undefined;

  constructor(userScopedClient: IScopedClusterClient) {
    this.osAPITools = new OSAPITools(userScopedClient);
    this.model = llmModel.model;
    this.agentTools = this.osAPITools.toolsList;
  }

  public async init(agentType: AgentTypes = 'chat') {
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
    const response =
      this.executorType === 'zeroshot'
        ? await this.executor?.run(question)
        : await this.executor?.call({ input: question });
    return response;
  };
}
