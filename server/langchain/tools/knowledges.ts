/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChain, RetrievalQAChain } from 'langchain/chains';
import { DynamicTool } from 'langchain/tools';
import { OpenSearchClient } from '../../../../../src/core/server';
import { llmModel } from '../models/llm_model';

export class KnowledgeTools {
  chain: BaseChain;
  toolsList = [
    new DynamicTool({
      name: 'Get Nginx information',
      description:
        'Use this tool to get Nginx related information, including setting up nginx and troubleshooting access logs. This tool takes the Nginx question as input.',
      func: (query: string) => this.ask_nginx(query),
    }),
  ];

  constructor(client: OpenSearchClient) {
    this.chain = RetrievalQAChain.fromLLM(
      llmModel.model,
      llmModel.createVectorStore(client).asRetriever(),
      { returnSourceDocuments: false }
    );
  }

  public async ask_nginx(query: string) {
    const res = await this.chain.call({ query });
    return res.text;
  }
}
