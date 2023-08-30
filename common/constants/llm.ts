/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const OBSERVABILITY_BASE = '/api/observability';
export const DSL_BASE = '/api/dsl';
export const DSL_SEARCH = '/search';

export const CHAT_API = {
  LLM: `${OBSERVABILITY_BASE}/chat/llm`,
  HISTORY: `${OBSERVABILITY_BASE}/chat/history`,
} as const;

export const LANGCHAIN_API = {
  PPL_GENERATOR: `${OBSERVABILITY_BASE}/langchain/ppl`,
  AGENT_TEST: `${OBSERVABILITY_BASE}/langchain/agent`,
  FEEDBACK: `${OBSERVABILITY_BASE}/chat/feedback`,
} as const;

export const LLM_INDEX = {
  FEEDBACK: '.llm-feedback',
  TRACES: '.llm-traces',
  VECTOR_STORE: '.llm-vector-store',
};
