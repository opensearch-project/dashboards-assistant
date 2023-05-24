import { ChatAnthropic } from 'langchain/chat_models/anthropic';
import { BaseLanguageModel } from 'langchain/dist/base_language';
import { Embeddings } from 'langchain/dist/embeddings/base';
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';

class LLMModel {
  model: BaseLanguageModel;
  embeddings: Embeddings;
  constructor(llm: 'claude' | 'openai' = 'claude') {
    switch (llm) {
      case 'openai':
        this.model = new OpenAI({ temperature: 0.1 });
        this.embeddings = new OpenAIEmbeddings();
        break;

      case 'claude':
      default:
        this.model = new ChatAnthropic({ temperature: 0.1 });
        this.embeddings = new HuggingFaceInferenceEmbeddings();
        break;
    }
  }
}

export const llmModel = new LLMModel();
