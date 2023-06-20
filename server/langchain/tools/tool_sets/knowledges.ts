/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RetrievalQAChain } from 'langchain/chains';
import { DynamicTool } from 'langchain/tools';
import { llmModel } from '../../models/llm_model';
import { swallowErrors } from '../../utils/utils';
import { PluginToolsFactory } from '../tools_factory/tools_factory';

export class KnowledgeTools extends PluginToolsFactory {
  chain = RetrievalQAChain.fromLLM(
    llmModel.model,
    llmModel.createVectorStore(this.opensearchClient).asRetriever(),
    { returnSourceDocuments: false }
  );

  toolsList = [
    /* new DynamicTool({
      name: 'Get Nginx information',
      description:
        'Use this tool to get Nginx related information, including setting up nginx and troubleshooting access logs. This tool takes the Nginx question as input.',
      func: swallowErrors((query: string) => this.askVectorStore(query)),
    }),
    new DynamicTool({
      name: 'Get generic information',
      description:
        'Use this tool to answer a generic question not related to OpenSearch cluster. This tool takes the question as input.',
      func: swallowErrors((query: string) => this.askVectorStore(query)),
    }), */
  ];

  public async askVectorStore(query: string) {
    const res = await this.chain.call({ query });
    return res.text;
  }
}
