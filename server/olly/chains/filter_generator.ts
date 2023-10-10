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
From the question, generate the user start and end times filters for their query.

The start time is the beginning of the time period the user is asking about. For example, if the user asks about all traces "From 4 years ago...", that means the start time is 4 years ago. Other ways the user might signal a start time includes "after last week" (the start time is 1 week ago) or "since 2018" (the start time is 2018)

The end time is the end of the time period the user is asking about. For example, if the user asks about all traces "before July 24th, 2022", the end time is July 24th, 2022. Other ways the user might signal an end time includes "till Feb" (the end time is Feburary, this year) or "Until next year" (the end time is next year)

Time formats can be absolute or relative.

If absolute, they are structured as "%year-%month-%dateT%hour:%minute.%second". An example would be "2004-08-01T16:03:02" meaning a time of August 1st, 2004, 4:03.022 PM, in the Pacific Time Zone. Another example would be the user specifying "2018", so your generation would be "2018-01-01T00:00:00".

If relative, they are relative to "now", and are structured as "now+%n%u" for in the future, or "now-%n%u" for in the past. The %n is a number, and %u is a unit of measurement. For units, "s" means seconds, "m" means minutes, "h" means hours, "d" means days, "w" means weeks, "M" means months, and "y" means years. An example would be "now-3w" meaning 3 weeks before now, and "now+4y" meaning 4 years from now.

---------------

Use the following steps to generate the start and end times:

Step 1. Use the user's query to write the start time in either absolute or relative time format. If you cannot generate one, set it to 'now-15m'.

Step 2. Use the user's query to write the end time in either absolute or relative time format. If you cannot generate one, set it to now.

Step 3. Return those in a JSON object, where the keys are 'start_time' and 'end_time', and the values are the generated start and end times.

{format_instructions}
---------------

Question: {question}

`.trim();

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  start_time: 'This is the start time',
  end_time: 'This is the end time',
});
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['question'],
  partialVariables: { format_instructions: formatInstructions },
});

export const requestTimesFiltersChain = async (
  model: BaseLanguageModel,
  question: string,
  callbacks?: Callbacks
) => {
  const chain = new LLMChain({ llm: model, prompt });
  const output = await chain.call({ question }, callbacks);
  return parser.parse(output.text);
};
