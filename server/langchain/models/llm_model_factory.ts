/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import { ChatAnthropic } from 'langchain/chat_models/anthropic';
import { Embeddings } from 'langchain/dist/embeddings/base';
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { OpenSearchVectorStore } from 'langchain/vectorstores/opensearch';
import { OpenSearchClient } from '../../../../../src/core/server';
import { MLCommonsChatModel } from './mlcommons_chat_model';

type ModelName = 'claude' | 'openai' | 'ml-commons-claude';

export class LLMModelFactory {
  static createModel(client: OpenSearchClient, name?: ModelName) {
    switch (name) {
      case 'openai':
        return new OpenAI({ temperature: 0.0000001 });

      case 'claude':
        return new ChatAnthropic({ temperature: 0.0000001 });

      case 'ml-commons-claude':
      default:
        return new MLCommonsChatModel({}, client);
    }
  }

  static createEmbeddings(name?: ModelName) {
    switch (name) {
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

  static createVectorStore(
    embeddings: Embeddings,
    client: OpenSearchClient,
    indexName = '.llm-vector-store'
  ) {
    return new OpenSearchVectorStore(embeddings, { client: client as Client, indexName });
  }
}
