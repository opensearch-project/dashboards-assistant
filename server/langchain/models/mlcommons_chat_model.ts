/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AI_PROMPT, HUMAN_PROMPT } from '@anthropic-ai/sdk';
import { BaseLanguageModelParams } from 'langchain/base_language';
import { CallbackManagerForLLMRun } from 'langchain/callbacks';
import { BaseChatModel } from 'langchain/chat_models/base';
import { AIMessage, BaseMessage, ChatResult, LLMResult, MessageType } from 'langchain/schema';
import { OpenSearchClient } from '../../../../../src/core/server';
import {
  ANTHROPIC_DEFAULT_PARAMS,
  ASSISTANT_CONFIG_DOCUMENT,
  ASSISTANT_CONFIG_INDEX,
  ML_COMMONS_BASE_API,
} from '../commons/constants';

interface AssistantConfigDoc {
  model_id: string;
}

export class MLCommonsChatModel extends BaseChatModel {
  opensearchClient: OpenSearchClient;

  constructor(fields: BaseLanguageModelParams, osClient: OpenSearchClient) {
    super(fields);
    this.opensearchClient = osClient;
  }

  _combineLLMOutput?(...llmOutputs: Array<LLMResult['llmOutput']>): LLMResult['llmOutput'] {
    return [];
  }

  _llmType(): string {
    return 'opensearch_mlcommons';
  }
  getAnthropicPromptFromMessage(type: MessageType): string {
    switch (type) {
      case 'ai':
        return AI_PROMPT;
      case 'human':
        return HUMAN_PROMPT;
      case 'system':
        return '';
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  private formatMessagesAsPrompt(messages: BaseMessage[]): string {
    return (
      messages
        .map((message) => {
          const messagePrompt = this.getAnthropicPromptFromMessage(message._getType());
          return `${messagePrompt} ${message.content}`;
        })
        .join('') + AI_PROMPT
    );
  }

  private jsonEncodeString(question: string): string {
    const jsonString = JSON.stringify({ value: question });
    return jsonString.slice(10, -2); // remove `{"value":"` and `"}`
  }

  async model_predict(question: string) {
    const getResponse = await this.opensearchClient.get<AssistantConfigDoc>({
      id: ASSISTANT_CONFIG_DOCUMENT,
      index: ASSISTANT_CONFIG_INDEX,
    });
    if (!getResponse.body._source) throw new Error('Assistant config source not found.');
    const mlCommonsModelId = getResponse.body._source.model_id;

    const mlCommonsResponse = await this.opensearchClient.transport.request({
      method: 'POST',
      path: `${ML_COMMONS_BASE_API}/${mlCommonsModelId}/_predict`,
      body: {
        parameters: {
          ...ANTHROPIC_DEFAULT_PARAMS,
          prompt: this.jsonEncodeString(question),
        },
      },
    });
    const respData = mlCommonsResponse.body.inference_results[0].output[0].dataAsMap;
    return respData.completion || respData.message || 'Failed to request model';
  }

  // for local testing only
  async local_model_predict(question: string) {
    return await fetch('http://localhost:8443', {
      method: 'POST',
      body: this.jsonEncodeString(question),
    }).then((r) => r.text());
  }

  async _call(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
    return await this.model_predict(this.formatMessagesAsPrompt(messages));
  }

  async _generate(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    const text = await this._call(messages, options, runManager);
    const message = new AIMessage(text);
    return {
      generations: [
        {
          text: message.content,
          message,
        },
      ],
    };
  }
}
