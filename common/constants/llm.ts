/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const API_BASE = '/api/assistant';
export const DSL_BASE = '/api/dsl';
export const DSL_SEARCH = '/search';
export const NOTEBOOK_PREFIX = '/api/observability/notebooks';

export const ASSISTANT_API = {
  SEND_MESSAGE: `${API_BASE}/send_message`,
  SESSION: `${API_BASE}/session`,
  SESSIONS: `${API_BASE}/sessions`,
  FEEDBACK: `${API_BASE}/feedback`,
  ABORT_AGENT_EXECUTION: `${API_BASE}/abort`,
  REGENERATE: `${API_BASE}/regenerate`,
  TRACE: `${API_BASE}/trace`,
} as const;

export const LLM_INDEX = {
  FEEDBACK: '.llm-feedback',
  TRACES: '.assistant-traces',
  SESSIONS: '.assistant-sessions',
  VECTOR_STORE: '.llm-vector-store',
};

export const NOTEBOOK_API = {
  CREATE_NOTEBOOK: `${NOTEBOOK_PREFIX}/note`,
  SET_PARAGRAPH: `${NOTEBOOK_PREFIX}/set_paragraphs/`,
};
