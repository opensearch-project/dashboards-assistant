/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { Callbacks } from 'langchain/callbacks';
import { loadQAStuffChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import { OpenSearchClient } from '../../../../../src/core/server';
import { SummarizationRequestSchema } from '../../routes/langchain_routes';
import { truncate } from '../utils/utils';
import { requestQuerySuggestionsChain } from './query_suggestions_generator';

interface SummarizationContext extends SummarizationRequestSchema {
  client: OpenSearchClient;
  model: BaseLanguageModel;
}

const createPrompt = (context: SummarizationContext) => {
  if (!context.isError) {
    return `You will be given a search response, summarize it as a concise paragraph while considering the following:
User's question on index '${context.index}': ${context.question}
PPL (Piped Processing Language) query used: ${context.query}

Give some documents to support your point.
Note that the output could be truncated, summarize what you see. Don't mention about total items returned and don't mention about the fact that output is truncated if you see 'Output is too long, truncated' in the response.
If you only see '{}', then there are no results matching the query.

Skip the introduction; go straight into the summarization.`;
  }

  return `You will be given an API response with errors, summarize it as a concise paragraph. Do not try to answer the user's question.
If the error cannot be fixed, eg. no such field or function not supported, then give suggestions to rephrase the question.
It is imperative that you must not give suggestions on how to fix the error or alternative PPL query.

Consider the following:
User's question on index '${context.index}': ${context.question}
${context.query ? 'PPL (Piped Processing Language) query used: ' + context.query : ''}

Skip the introduction; go straight into the summarization.`;
};

/**
 * Generate a summary based on user question, corresponding PPL query, and
 * query results.
 *
 * @param context
 * @param callbacks
 * @returns summarized text
 */
export const requestSummarizationChain = async (
  context: SummarizationContext,
  callbacks?: Callbacks
) => {
  const chain = loadQAStuffChain(context.model);
  // vector search doesn't help much since the response is already retrieved based on user's question
  const docs = [new Document({ pageContent: truncate(context.response) })];
  const question = createPrompt(context);
  const [output, suggestions] = await Promise.all([
    chain.call({ input_documents: docs, question }, { callbacks }),
    requestQuerySuggestionsChain(context.model, context.client, context.index, callbacks),
  ]);
  return { summary: output.text, suggestedQuestions: suggestions };
};
