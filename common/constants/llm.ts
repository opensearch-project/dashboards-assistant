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
  CONVERSATION: `${API_BASE}/conversation`,
  CONVERSATIONS: `${API_BASE}/conversations`,
  FEEDBACK: `${API_BASE}/feedback`,
  ABORT_AGENT_EXECUTION: `${API_BASE}/abort`,
  REGENERATE: `${API_BASE}/regenerate`,
  TRACE: `${API_BASE}/trace`,
  ACCOUNT: `${API_BASE}/account`,
} as const;

export const TEXT2VIZ_API = {
  TEXT2PPL: `${API_BASE}/text2ppl`,
  TEXT2VEGA: `${API_BASE}/text2vega`,
};

export const NOTEBOOK_API = {
  CREATE_NOTEBOOK: `${NOTEBOOK_PREFIX}/note`,
  SET_PARAGRAPH: `${NOTEBOOK_PREFIX}/set_paragraphs/`,
};

export const DEFAULT_USER_NAME = 'User';
