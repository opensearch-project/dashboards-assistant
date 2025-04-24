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

export const AGENT_API = {
  EXECUTE: `${API_BASE}/agent/_execute`,
  CONFIG_EXISTS: `${API_BASE}/agent_config/_exists`,
};

export const SUMMARY_ASSISTANT_API = {
  SUMMARIZE: `${API_BASE}/summary`,
  INSIGHT: `${API_BASE}/insight`,
  DATA2SUMMARY: `${API_BASE}/data2summary`,
};
export const NOTEBOOK_API = {
  CREATE_NOTEBOOK: `${NOTEBOOK_PREFIX}/note/savedNotebook`,
  SET_PARAGRAPH: `${NOTEBOOK_PREFIX}/savedNotebook/set_paragraphs`,
  ADD_PARAGRAPH: `${NOTEBOOK_PREFIX}/savedNotebook/paragraph`,
};

export const DEFAULT_USER_NAME = 'User';

export const TEXT2VEGA_INPUT_SIZE_LIMIT = 400;

export const TEXT2VEGA_RULE_BASED_AGENT_CONFIG_ID = 'os_text2vega';
export const TEXT2VEGA_WITH_INSTRUCTIONS_AGENT_CONFIG_ID = 'os_text2vega_with_instructions';
export const TEXT2PPL_AGENT_CONFIG_ID = 'os_query_assist_ppl';
export const DATA2SUMMARY_AGENT_CONFIG_ID = 'os_data2summary';
