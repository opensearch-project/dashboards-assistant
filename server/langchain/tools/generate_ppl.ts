/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { request as requestEntities } from '../chains/entities_finder';
import { request as requestPPLGenerator } from '../chains/ppl_generator';

interface GeneratePPLOptions {
  question: string;
  index: string;
  timeField: string;
  fields: string;
}
export const generatePPL = async (options: GeneratePPLOptions) => {
  try {
    const entitiesHints = await requestEntities(options.question, options.fields);
    const input = `${options.question}\n${entitiesHints}, index is \`${options.index}\``;
    const ppl = await requestPPLGenerator(input);
    logToFile({ question: options.question, input, ppl });
    ppl.query = ppl.query.replace(/^source\s*=\s*`(.+?)`/, 'source=$1'); // workaround for https://github.com/opensearch-project/dashboards-observability/issues/509
    return ppl;
  } catch (error) {
    logToFile({ question: options.question, error });
  }
};

const logToFile = async (status: object) => {
  await fs.mkdir(`${__dirname}/../../../.logs`, { recursive: true });
  fs.appendFile(
    `${__dirname}/../../../.logs/ppl_generator.log`,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...status,
    }) + '\n'
  );
};
