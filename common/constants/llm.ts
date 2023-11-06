/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const API_BASE = '/api/assistant';
export const DSL_BASE = '/api/dsl';
export const DSL_SEARCH = '/search';

export const ASSISTANT_API = {
  SEND_MESSAGE: `${API_BASE}/send_message`,
  SESSION: `${API_BASE}/session`,
  SESSIONS: `${API_BASE}/sessions`,
  PPL_GENERATOR: `${API_BASE}/generate_ppl`,
  AGENT_TEST: `${API_BASE}/agent_test`,
  FEEDBACK: `${API_BASE}/feedback`,
  ABORT_AGENT_EXECUTION: `${API_BASE}/abort`,
} as const;

export const LLM_INDEX = {
  FEEDBACK: '.llm-feedback',
  TRACES: '.assistant-traces',
  SESSIONS: '.assistant-sessions',
  VECTOR_STORE: '.llm-vector-store',
};
