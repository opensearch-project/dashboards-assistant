/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { Callbacks } from 'langchain/callbacks';
import { LLMChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { BaseMessage } from 'langchain/schema';
import { Tool } from 'langchain/tools';

const template = `
You will be given a chat history between OpenSearch Assistant and a Human.
Use the context provided to generate follow up questions the Human would ask to the Assistant.

The Assistant can answer general questions about logs, traces and metrics.

Assistant can access a set of tools listed below to answer questions given by the Human:
{tools_description}


Here's the chat history between the human and the Assistant.
{chat_history}

Use the following steps to generate follow up questions Human may ask after the response of the Assistant:

Step 1. Use the chat history to understand what human is trying to search and explore.

Step 2. Understand what capabilities the assistant has with the set of tools it has access to.

Step 3. Use the above context and generate follow up questions.

----------------
{format_instructions}
----------------
`.trim();

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  question1: 'This is the first follow up question',
  question2: 'This is the second follow up question',
});
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['tools_description', 'chat_history'],
  partialVariables: { format_instructions: formatInstructions },
});

const convertChatToString = (chatMessages: BaseMessage[]) => {
  const chatString = chatMessages
    .map((message) => `${message._getType()}: ${message.text}`)
    .join('\n');
  return chatString;
};

export const requestSuggestionsChain = async (
  model: BaseLanguageModel,
  tools: Tool[],
  memory: BufferMemory,
  callbacks?: Callbacks
) => {
  const toolsContext = tools.map((tool) => `${tool.name}: ${tool.description}`).join('\n');

  const chatHistory = memory.chatHistory;
  const chatContext = convertChatToString(await chatHistory.getMessages());
  const chain = new LLMChain({ llm: model, prompt });
  const output = await chain.call(
    { tools_description: toolsContext, chat_history: chatContext },
    callbacks
  );
  return parser.parse(output.text);
};
