/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { ConfigSchema } from '../common/types/config';
import {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/server';
import { AssistantPluginSetup, AssistantPluginStart, MessageParser } from './types';
import { BasicInputOutputParser } from './parsers/basic_input_output_parser';
import { VisualizationCardParser } from './parsers/visualization_card_parser';
import { registerChatRoutes } from './routes/chat_routes';

export class AssistantPlugin implements Plugin<AssistantPluginSetup, AssistantPluginStart> {
  private readonly logger: Logger;
  private messageParsers: MessageParser[] = [];

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup): Promise<AssistantPluginSetup> {
    this.logger.debug('Assistant: Setup');
    const config = await this.initializerContext.config
      .create<ConfigSchema>()
      .pipe(first())
      .toPromise();

    const router = core.http.createRouter();

    core.http.registerRouteHandlerContext('assistant_plugin', () => {
      return {
        config,
        logger: this.logger,
      };
    });

    // Register server side APIs
    registerChatRoutes(router, {
      messageParsers: this.messageParsers,
      auth: core.http.auth,
    });

    core.capabilities.registerProvider(() => ({
      observability: {
        show: true,
      },
    }));

    const registerMessageParser = (messageParser: MessageParser) => {
      const findItem = this.messageParsers.find((item) => item.id === messageParser.id);
      if (findItem) {
        throw new Error(`There is already a messageParser whose id is ${messageParser.id}`);
      }

      this.messageParsers.push(messageParser);
    };

    registerMessageParser(BasicInputOutputParser);
    registerMessageParser(VisualizationCardParser);

    return {
      registerMessageParser,
      removeMessageParser: (parserId: MessageParser['id']) => {
        const findIndex = this.messageParsers.findIndex((item) => item.id === parserId);
        if (findIndex < 0) {
          this.logger.error(`There is not a messageParser whose id is ${parserId}`);
        }

        this.messageParsers.splice(findIndex, 1);
      },
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('Assistant: Started');
    return {};
  }

  public stop() {}
}
