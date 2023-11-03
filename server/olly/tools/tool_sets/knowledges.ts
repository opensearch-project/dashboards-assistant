/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RetrievalQAChain } from 'langchain/chains';
import { DynamicTool } from 'langchain/tools';
import { LLMModelFactory } from '../../models/llm_model_factory';
import { protectCall } from '../../utils/utils';
import { PluginToolsBase } from '../tools_base';

const createGenericPrompt = (query: string) =>
  `Use the following rules to respond to an input

1. A relevant question is a question that asks about OpenSearch or about you.
2. If the input is an answer to a relevant question, then use the input as the response, do not modify the input.
3. If the input is a relevant question, then answer the question based on your own knowledge.
4. If the input is a question but not relevant, then respond with "I do not have any information in my expertise about the question, please ask OpenSearch related questions.".

Input:
${query}
`.trim();

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
      func: protectCall((query: string) => this.askVectorStore(query)),
      callbacks: this.callbacks,
    }),
    new DynamicTool({
      name: 'Get generic information',
      description:
        'Use this tool to answer a generic question that is not related to any specific OpenSearch cluster, for example, instructions on how to do something. This tool takes the question as input.',
      func: async (query: string) => createGenericPrompt(query),
      callbacks: this.callbacks,
    }),
  ];

  public async askVectorStore(query: string) {
    const res = await this.chain.call({ query });
    return res.text;
  }
}
