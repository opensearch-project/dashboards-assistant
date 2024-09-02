/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, Interaction } from '../common/types/chat_saved_object_attributes';
import { Logger, HttpAuth } from '../../../src/core/server';

export interface AssistantPluginSetup {
  registerMessageParser: (message: MessageParser) => void;
  removeMessageParser: (parserId: MessageParser['id']) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantPluginStart {}

export interface ProviderOptions {
  interactions: Interaction[];
}

export interface MessageParser {
  /**
   * The id of the parser, should be unique among the parsers.
   */
  id: string;
  /**
   * Order field declares the order message parser will be execute.
   * parser with order 2 will be executed after parser with order 1.
   * If not specified, the default order will be 999.
   * @default 999
   */
  order?: number;
  /**
   * parserProvider is the callback that will be triggered in each message
   */
  parserProvider: (
    interaction: Interaction,
    options: ProviderOptions
  ) => Promise<Array<Omit<IMessage, 'messageId'>>>;
}

export interface RoutesOptions {
  messageParsers: MessageParser[];
  auth: HttpAuth;
}

declare module '../../../src/core/server' {
  interface RequestHandlerContext {
    assistant_plugin: {
      logger: Logger;
    };
  }
}

export const SummaryType = [
  {
    id: 'alerts',
    prompt: `You are an OpenSearch Alert Assistant to help summarize the alerts.\n Here is the detail of alert: $\{parameters.context};\n The question is: $\{parameters.question}`,
  },
];

export const InsightType = [
  {
    id: 'alerts',
    prompt: `You are an OpenSearch Alert Assistant to provide your insight on this alert to help users understand the alert, find potential causes and give feasible solutions to address it.\n Here is the detail of alert: $\{parameters.context};\n The alert summary is: $\{parameters.summary};\n The question is: $\{parameters.question}`,
  },
];
