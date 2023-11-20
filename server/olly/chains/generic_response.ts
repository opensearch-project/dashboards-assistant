/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { Callbacks } from 'langchain/callbacks';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

const template = `
Use the following rules to respond to an input

1. A relevant question is a question that asks about OpenSearch or about you.
2. If the input is an answer to a relevant question, say "input is a relevant answer".
3. If the input is a relevant question, then answer the question based on your own knowledge.
4. If the input is a question but not relevant, say "input is irrelevant".

Input:
{question}
`.trim();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['question'],
});

export const requestGenericResponseChain = async (
  model: BaseLanguageModel,
  question: string,
  callbacks?: Callbacks
): Promise<string> => {
  const chain = new LLMChain({ llm: model, prompt });
  const output = await chain.call({ question }, callbacks);
  if (output.text.includes('input is a relevant answer')) {
    return question;
  }
  if (output.text.includes('input is irrelevant')) {
    return 'I do not have any information in my expertise about the question, please ask OpenSearch related questions.';
  }
  return output.text;
};
