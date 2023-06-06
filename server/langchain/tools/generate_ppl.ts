/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../../src/core/server';
import { requestPPLGeneratorChain } from '../chains/ppl_generator';
import { generateFieldContext } from '../utils/ppl_generator';
import { logToFile } from '../utils/utils';

interface GeneratePPLOptions {
  index: string;
  question: string;
}

export const generatePPL = async (client: OpenSearchClient, options: GeneratePPLOptions) => {
  try {
    const mappings = await client.indices.getMapping({ index: options.index });
    const sampleDoc = await client.search({ index: options.index, size: 1 });
    const fields = generateFieldContext(mappings, sampleDoc);

    const input = `Fields:\n${fields}\nQuestion: ${options.question}? index is \`${options.index}\``;
    const ppl = await requestPPLGeneratorChain(input);
    logToFile({ question: options.question, input, ppl }, 'ppl_generator');
    ppl.query = ppl.query.replace(/^source\s*=\s*`(.+?)`/, 'source=$1'); // workaround for https://github.com/opensearch-project/dashboards-observability/issues/509
    return ppl;
  } catch (error) {
    logToFile({ question: options.question, error }, 'ppl_generator');
  }
};
