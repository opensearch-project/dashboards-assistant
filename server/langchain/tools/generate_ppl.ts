/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { request as requestEntities } from '../chains/entities_finder';
import { request as requestPPLGenerator } from '../chains/ppl_generator';

interface GeneratePPLOptions {
  question: string;
  index: string;
  timeField: string;
  fields: Record<string, string>;
}
export const generatePPL = async (options: GeneratePPLOptions) => {
  const entitiesHints = await requestEntities(options.question, options.fields);
  // const input = `${options.question} ${entitiesHints}, time field is \`${options.timeField}\`, index is \`${options.index}\``;
  const input = `${options.question} ${entitiesHints}, index is \`${options.index}\``;
  console.info('❗input:', input);
  const ppl = await requestPPLGenerator(input);
  console.info('❗ppl:', ppl);
  return ppl;
};
