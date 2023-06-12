/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../src/core/server';
import { PPL_DATASOURCES_REQUEST } from '../../../common/constants/metrics';
import { requestGuessingIndexChain } from '../chains/guessing_index';
import { requestPPLGeneratorChain } from '../chains/ppl_generator';
import { generateFieldContext } from '../utils/ppl_generator';
import { logToFile } from '../utils/utils';

interface PPLResponse {
  schema: Array<{ name: string; type: string }>;
  datarows: unknown[][];
  total: number;
  size: number;
}

export class PPLTools {
  opensearchClient: OpenSearchClient;
  observabilityClient: ILegacyScopedClusterClient;
  toolsList = [
    new DynamicTool({
      name: 'Generate generic PPL query',
      description:
        'Use this tool to generate a PPL query for a general question. This tool takes the question as input.',
      func: (query: string) => this.generatePPL(query),
    }),
    new DynamicTool({
      name: 'Generate prometheus PPL query',
      description:
        'Use this tool to generate a PPL query for a question about metrics. This tool takes the question as input.',
      func: (query: string) => this.generatePPL(query),
    }),
    new DynamicTool({
      name: 'Execute PPL query',
      description: 'Use this tool to run a PPL query. This tool takes the PPL query as input.',
      func: (query: string) =>
        this.executePPL(query).then((result) => JSON.stringify(result, null, 2)),
    }),
  ];

  constructor(opensearchClient: OpenSearchClient, observabilityClient: ILegacyScopedClusterClient) {
    this.opensearchClient = opensearchClient;
    this.observabilityClient = observabilityClient;
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

  private async getPrometheusMetricList() {
    const response = await this.executePPL(PPL_DATASOURCES_REQUEST);
    return Promise.all(
      response.datarows.map(([dataSource]) =>
        this.executePPL(`source = ${dataSource}.information_schema.tables`).then((tables) =>
          tables.datarows.map((row) => {
            const obj: { [k: string]: unknown } = {};
            row.forEach((value, i) => (obj[tables.schema[i].name] = value));
            return {
              table: `${obj.TABLE_CATALOG}.${obj.TABLE_NAME}`,
              type: obj.TABLE_TYPE as string,
              description: obj.REMARKS as string,
            };
          })
        )
      )
    ).then((responses) => responses.flat());
  }

  public async executePPL(query: string) {
    const response: PPLResponse = await this.observabilityClient.callAsCurrentUser('ppl.pplQuery', {
      body: { query },
    });
    return response;
  }

  public async generatePrometheusPPL(question: string, index?: string) {
    if (!index) {
      const prometheusMetricList = await this.getPrometheusMetricList();
      const response = await requestGuessingIndexChain(
        question,
        prometheusMetricList.map(
          (metric) => `index: ${metric.table}, description: ${metric.description}`
        )
      );
      index = response.index;
    }
    return `source = ${index} | stats avg(@value) by span(@timestamp, 1h)`;
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
