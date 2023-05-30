/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { request as requestEntities } from '../chains/entities_finder';
import { request as requestPPLGenerator } from '../chains/ppl_generator';

interface GeneratePPLOptions {
  question: string;
  index: string;
  fields: Record<string, string>;
}
export const generatePPL = async ({ question, index, fields }: GeneratePPLOptions) => {
  const entitiesHints = await requestEntities(question, fields);
  const input = question + entitiesHints + ' index is ' + index;
  console.info('❗input:', input);
  const ppl = await requestPPLGenerator(input);
  console.info('❗ppl:', ppl);
  return ppl;
};
