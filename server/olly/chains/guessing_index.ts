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
From the given list of index names, pick the one that is the most relevant to the question. Use the following rules to pick:

1. If the question contains the index, and the index is present in the list below, return the index as the response.
2. If the question contains the index, but the index is not present in the list below, make a guess and return the most relevant index from the list below.
3. If the question does not mention the exact index name, make a guess and return the most relevant index from the list below.
4. If there are multiple relevant indices with the same prefix and the question does not mention any specific one, return \`prefix*\`.

{format_instructions}
----------------

Question: {question}
Index names:
{indexNames}
`.trim();

const parser = StructuredOutputParser.fromNamesAndDescriptions({ index: 'This is the index name' });
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['question', 'indexNames'],
  partialVariables: { format_instructions: formatInstructions },
});

export const requestGuessingIndexChain = async (
  model: BaseLanguageModel,
  question: string,
  indexNameList: string[],
  callbacks?: Callbacks
) => {
  const chain = new LLMChain({ llm: model, prompt });
  const output = await chain.call({ question, indexNames: indexNameList.join('\n') }, callbacks);
  return parser.parse(output.text);
};
