/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, Interaction } from '../common/types/chat_saved_object_attributes';
import { Logger } from '../../../src/core/server';

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
  parserProvider: (interaction: Interaction, options: ProviderOptions) => Promise<IMessage[]>;
}

export interface RoutesOptions {
  messageParsers: MessageParser[];
  rootAgentId?: string;
}

declare module '../../../src/core/server' {
  interface RequestHandlerContext {
    assistant_plugin: {
      logger: Logger;
    };
  }
}
