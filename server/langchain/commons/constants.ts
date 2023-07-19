/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ML_COMMONS_BASE_API = '/_plugins/_ml/models';

// Below params are inspired from langchain defaults
export const ANTHROPIC_DEFAULT_PARAMS = {
  model: 'claude-v1',
  top_k: -1,
  top_p: -1,
  temperature: 1,
  max_tokens_to_sample: 2048,
};

export const ASSISTANT_CONFIG_INDEX = '.chat-assistant-config';
export const ASSISTANT_CONFIG_DOCUMENT = 'model-config';
