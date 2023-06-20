/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { PPLTools } from './ppl';
import { swallowErrors } from '../../utils/utils';

export class QueryTools extends PPLTools {
  toolsList = [
    new DynamicTool({
      name: 'Log info',
      description:
        'Use to get information of logs if the question contains an OpenSearch log index. The input should be the name of the index',
      func: swallowErrors(async (index: string) => {
        const ppl = await this.generatePPL(`Give me log patterns? index is '${index}'`);
        const results = await this.executePPL(ppl);
        return `The PPL query is: ${ppl}\n\nThe results are:\n${JSON.stringify(results, null, 2)}`;
      }),
    }),
    new DynamicTool({
      name: 'Log error info',
      description:
        'Use to get information of logs with errors if the question contains an OpenSearch log index. The input should be the name of the index',
      func: swallowErrors(async (index: string) => {
        const ppl = await this.generatePPL(
          `Give me log patterns for logs with errors? index is '${index}'`
        );
        const results = await this.executePPL(ppl);
        return `The PPL query is: ${ppl}\n\nThe results are:\n${JSON.stringify(results, null, 2)}`;
      }),
    }),
  ];
}
