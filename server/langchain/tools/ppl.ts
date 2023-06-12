/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../src/core/server';
import { requestGuessingIndexChain } from '../chains/guessing_index';
import { requestPPLGeneratorChain } from '../chains/ppl_generator';
import { generateFieldContext } from '../utils/ppl_generator';
import { logToFile } from '../utils/utils';

export class PPLTools {
  opensearchClient: OpenSearchClient;
  legacyClient: ILegacyScopedClusterClient;
  toolsList = [
    new DynamicTool({
      name: 'Generate generic PPL query',
      description:
        'Use this tool to generate a PPL query for a general question. This tool takes the question as input.',
      func: (query: string) => this.generatePPL(query),
    }),
  ];

  constructor(opensearchClient: OpenSearchClient, legacyClient: ILegacyScopedClusterClient) {
    this.opensearchClient = opensearchClient;
    this.legacyClient = legacyClient;
  }

  /**
   * @returns non hidden OpenSearch index names as a list.
   */
  private async getIndexNameList() {
    const response = await this.opensearchClient.cat.indices({ format: 'json' });
    return response.body
      .map((index) => index.index)
      .filter((index) => index !== undefined && !index.startsWith('.')) as string[];
  }

  public async generatePPL(question: string, index?: string) {
    if (!index) {
      const indexNameList = await this.getIndexNameList();
      const response = await requestGuessingIndexChain(question, indexNameList);
      index = response.index;
    }

    try {
      const [mappings, sampleDoc] = await Promise.all([
        this.opensearchClient.indices.getMapping({ index }),
        this.opensearchClient.search({ index, size: 1 }),
      ]);
      const fields = generateFieldContext(mappings, sampleDoc);

      const input = `Fields:\n${fields}\nQuestion: ${question}? index is \`${index}\``;
      const ppl = await requestPPLGeneratorChain(input);
      logToFile({ question, input, ppl }, 'ppl_generator');
      ppl.query = ppl.query.replace(/^source\s*=\s*`(.+?)`/, 'source=$1'); // workaround for https://github.com/opensearch-project/dashboards-observability/issues/509
      return ppl.query;
    } catch (error) {
      logToFile({ question, error }, 'ppl_generator');
      return `Error when generating PPL query: ${error}`;
    }
  }
}
