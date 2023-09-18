/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import { Callbacks } from 'langchain/callbacks';
import { ChatAnthropic } from 'langchain/chat_models/anthropic';
import { Embeddings } from 'langchain/dist/embeddings/base';
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { OpenSearchVectorStore } from 'langchain/vectorstores/opensearch';
import { OpenSearchClient } from '../../../../../src/core/server';
import { LLM_INDEX } from '../../../common/constants/llm';
import { MLCommonsChatModel } from './mlcommons_chat_model';

type ModelName = 'claude' | 'openai' | 'ml-commons-claude';

interface CreateModelOptions {
  client: OpenSearchClient;
  callbacks?: Callbacks;
  name?: ModelName;
}

interface CreateEmbeddingsOptions {
  name?: ModelName;
}

interface CreateVectorStoreOptions {
  embeddings: Embeddings;
  client: OpenSearchClient;
  indexName?: string;
}

export class LLMModelFactory {
  static createModel(options: CreateModelOptions) {
    switch (options.name) {
      case 'openai':
        return new OpenAI({ temperature: 0.0000001, callbacks: options.callbacks });

      case 'claude':
        return new ChatAnthropic({ temperature: 0.0000001, callbacks: options.callbacks });

      case 'ml-commons-claude':
      default:
        return new MLCommonsChatModel({ callbacks: options.callbacks }, options.client);
    }
  }

  static createEmbeddings(options: CreateEmbeddingsOptions = {}) {
    switch (options.name) {
      case 'openai':
        return new OpenAIEmbeddings();

      case 'claude':
      case 'ml-commons-claude':
      default:
        return new HuggingFaceInferenceEmbeddings({
          model: 'sentence-transformers/all-mpnet-base-v2',
          apiKey: process.env.HUGGINGFACEHUB_API_TOKEN,
        });
    }
  }

  static createVectorStore(options: CreateVectorStoreOptions) {
    const { embeddings, client, indexName = LLM_INDEX.VECTOR_STORE } = options;
    return new OpenSearchVectorStore(embeddings, { client: client as Client, indexName });
  }
}
