/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { AI_PROMPT, HUMAN_PROMPT } from '@anthropic-ai/sdk';
import { BaseChatModel } from 'langchain/chat_models/base';
import { BaseChatMessage, ChatResult, AIChatMessage, MessageType } from 'langchain/schema';
import { CallbackManagerForLLMRun } from 'langchain/callbacks';
import { BaseLanguageModelParams } from 'langchain/base_language';
import { OpenSearchClient } from '../../../../../src/core/server';
import {
  ANTHROPIC_DEFAULT_PARAMS,
  ASSISTANT_CONFIG_DOCUMENT,
  ASSISTANT_CONFIG_INDEX,
  ML_COMMONS_BASE_API,
} from '../commons/constants';

export class MLCommonsChatModel extends BaseChatModel {
  opensearchClient: OpenSearchClient;

  constructor(fields: BaseLanguageModelParams, osClient: OpenSearchClient) {
    super(fields);
    this.opensearchClient = osClient;
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  _combineLLMOutput?(
    ...llmOutputs: Array<Record<string, any> | undefined>
  ): Record<string, any> | undefined {
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

  private formatMessagesAsPrompt(messages: BaseChatMessage[]): string {
    return (
      messages
        .map((message) => {
          const messagePrompt = this.getAnthropicPromptFromMessage(message._getType());
          return `${messagePrompt} ${message.text}`;
        })
        .join('') + AI_PROMPT
    );
  }

  private jsonEncodeString(question: string): string {
    const jsonString = JSON.stringify({ value: question });
    return jsonString.slice(10, -2);
  }

  async model_predict(question: string) {
    const getResponse = await this.opensearchClient.get({
      id: ASSISTANT_CONFIG_DOCUMENT,
      index: ASSISTANT_CONFIG_INDEX,
    });
    const mlCommonsModelId = getResponse.body._source.model_id;

    // console.log('final object: ');
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
    // TODO: Handle error here
    return mlCommonsResponse.body.inference_results[0].output[0].dataAsMap.completion;
  }

  async _call(
    messages: BaseChatMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
    return await this.model_predict(this.formatMessagesAsPrompt(messages));
  }

  async _generate(
    messages: BaseChatMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    const text = await this._call(messages, options, runManager);
    const message = new AIChatMessage(text);
    return {
      generations: [
        {
          text: message.text,
          message,
        },
      ],
    };
  }
}
