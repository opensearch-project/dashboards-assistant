/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RetrievalQAChain } from 'langchain/chains';
import { DynamicTool } from 'langchain/tools';
import { LLMModelFactory } from '../../models/llm_model_factory';
import { swallowErrors } from '../../utils/utils';
import { PluginToolsBase } from '../tools_base';

export class KnowledgeTools extends PluginToolsBase {
  chain = RetrievalQAChain.fromLLM(
    this.model,
    LLMModelFactory.createVectorStore({
      embeddings: this.embeddings,
      client: this.opensearchClient,
    }).asRetriever(),
    { returnSourceDocuments: true }
  );

  toolsList = [
    new DynamicTool({
      name: 'Get ticket information',
      description:
        'Use this tool to find tickets in the system with incidents that are relevant to a question about error causes. This tool takes the question as input.',
      func: swallowErrors((query: string) => this.askVectorStore(query)),
      callbacks: this.callbacks,
    }),
    new DynamicTool({
      name: 'Get generic information',
      description:
        'Use this tool to answer a generic question not related to OpenSearch cluster. This tool takes the question as input.',
      func: async (query: string) =>
        'I do not have any information in my expertise about the question, please ask OpenSearch related questions.',
      callbacks: this.callbacks,
    }),
  ];

  public async askVectorStore(query: string) {
    const res = await this.chain.call({ query });
    return res.text;
  }
}
