/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, Interaction } from '../common/types/chat_saved_object_attributes';
import { ILegacyClusterClient, Logger } from '../../../src/core/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantPluginStart {}

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
  parserProvider: (interaction: Interaction) => Promise<IMessage[]>;
}

export interface RoutesOptions {
  messageParsers: MessageParser[];
}

declare module '../../../src/core/server' {
  interface RequestHandlerContext {
    assistant_plugin: {
      logger: Logger;
    };
  }
}
