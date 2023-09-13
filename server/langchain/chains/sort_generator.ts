/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { Callbacks } from 'langchain/callbacks';
import { LLMChain } from 'langchain/chains';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';

const template = `
You will be given the query that the user asked, as 'userQuery', as well as a list of fields in the result.
Step 1: Determine the field in the list of fields most applicable to the user's question. For example, if the user asks about error rates, and a field exists named 'error_rates.value', that should be the field you choose. If none are applicable, choose the first field in the list of fields.
Step 2. Return those in a JSON object, where the key is 'field', along with the field to be sorted.
{format_instructions}
---------------
Question: {question}
Fields: {fields}
`.trim();

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  field: 'This is the field to sort the results by',
});
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['question', 'fields'],
  partialVariables: { format_instructions: formatInstructions },
});

export const requestSortChain = async (
  model: BaseLanguageModel,
  question: string,
  fields: string,
  callbacks?: Callbacks
) => {
  const chain = new LLMChain({ llm: model, prompt });
  const output = await chain.call({ question, fields }, callbacks);
  return parser.parse(output.text);
};
