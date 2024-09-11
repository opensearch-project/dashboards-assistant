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
import { registerText2VizRoutes } from './routes/text2viz_routes';
import { AssistantService } from './services/assistant_service';
import { registerAgentRoutes } from './routes/agent_routes';
import { registerSummaryAssistantRoutes } from './routes/summary_routes';

export class AssistantPlugin implements Plugin<AssistantPluginSetup, AssistantPluginStart> {
  private readonly logger: Logger;
  private messageParsers: MessageParser[] = [];
  private assistantService = new AssistantService();

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup): Promise<AssistantPluginSetup> {
    this.logger.debug('Assistant: Setup');
    const config = await this.initializerContext.config
      .create<ConfigSchema>()
      .pipe(first())
      .toPromise();

    const assistantServiceSetup = this.assistantService.setup();

    const router = core.http.createRouter();

    core.http.registerRouteHandlerContext('assistant_plugin', () => {
      return {
        config,
        logger: this.logger,
      };
    });

    registerAgentRoutes(router, assistantServiceSetup);

    // Register server side APIs
    registerChatRoutes(router, {
      messageParsers: this.messageParsers,
      auth: core.http.auth,
    });

    // Register router for text to visualization
    if (config.next.enabled) {
      registerText2VizRoutes(router, assistantServiceSetup);
      registerSummaryAssistantRoutes(router, assistantServiceSetup);
    }

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
      assistantService: assistantServiceSetup,
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
    this.assistantService.start();
    return {};
  }

  public stop() {
    this.assistantService.stop();
  }
}
