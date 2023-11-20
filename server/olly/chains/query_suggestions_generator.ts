/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { Callbacks } from 'langchain/callbacks';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { OpenSearchClient } from '../../../../../src/core/server';
import { generateFieldContext } from '../utils/ppl_generator';

export const requestQuerySuggestionsChain = async (
  model: BaseLanguageModel,
  client: OpenSearchClient,
  index: string,
  callbacks?: Callbacks
) => {
  const [mappings, sampleDoc] = await Promise.all([
    client.indices.getMapping({ index }),
    client.search({ index, size: 1 }),
  ]);
  const fields = generateFieldContext(mappings, sampleDoc);
  const prompt = new PromptTemplate({
    template: `OpenSearch index: {index}

Recommend 2 or 3 possible questions on this index given the fields below. Only give the questions, do not give descriptions of questions and do not give PPL queries.

The format for a field is
\`\`\`
- field_name: field_type (sample field value)
\`\`\`

Fields:
${fields}

Put each question in a <question> tag.`,
    inputVariables: ['index', 'fields'],
  });

  const chain = new LLMChain({ llm: model, prompt });
  const output = await chain.call({ index, fields }, callbacks);
  const match = Array.from(output.text.matchAll(/<question>((.|[\r\n])+?)<\/question>/g)).map(
    (m) => (m as unknown[])[1]
  );
  if (match.length === 0) throw new Error(output.text);
  return match as string[];
};
