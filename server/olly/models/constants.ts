/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ML_COMMONS_BASE_API = '/_plugins/_ml';

// Below params are inspired from langchain defaults
export const ANTHROPIC_DEFAULT_PARAMS = {
  temperature: 0.0000001,
  max_tokens_to_sample: 2048,
};

export const ASSISTANT_CONFIG_INDEX = '.chat-assistant-config';
export const ASSISTANT_CONFIG_DOCUMENT = 'model-config';
