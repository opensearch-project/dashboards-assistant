/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import { ChatAnthropic } from 'langchain/chat_models/anthropic';
import { BaseLanguageModel } from 'langchain/dist/base_language';
import { Embeddings } from 'langchain/dist/embeddings/base';
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { OpenSearchVectorStore } from 'langchain/vectorstores/opensearch';
import { OpenSearchClient } from '../../../../../src/core/server';

type ModelName = 'claude' | 'openai';

class LLMModel {
  name: ModelName;
  #model?: BaseLanguageModel;
  #embeddings?: Embeddings;

  constructor(name: ModelName = 'claude') {
    this.name = name;
  }

  lazyInit() {
    if (this.#model && this.#embeddings) return;
    switch (this.name) {
      case 'openai':
        this.#model = new OpenAI({ temperature: 0.0000001 });
        this.#embeddings = new OpenAIEmbeddings();
        break;

      case 'claude':
      default:
        this.#model = new ChatAnthropic({ temperature: 0.0000001 });
        this.#embeddings = new HuggingFaceInferenceEmbeddings({
          model: 'sentence-transformers/all-mpnet-base-v2',
        });
        break;
    }
  }

  public get model() {
    this.lazyInit();
    return this.#model!;
  }

  public get embeddings() {
    this.lazyInit();
    return this.#embeddings!;
  }

  public createVectorStore(client: OpenSearchClient, indexName = '.llm-vector-store') {
    return new OpenSearchVectorStore(this.embeddings, { client: client as Client, indexName });
  }
}

export const llmModel = new LLMModel();
