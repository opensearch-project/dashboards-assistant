/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import 'web-streams-polyfill';
import { AssistantConfig } from '.';
import {
  CoreSetup,
  CoreStart,
  ILegacyClusterClient,
  Logger,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/server';
import { OpenSearchAlertingPlugin } from './adaptors/opensearch_alerting_plugin';
import { OpenSearchObservabilityPlugin } from './adaptors/opensearch_observability_plugin';
import { PPLPlugin } from './adaptors/ppl_plugin';
import { setupRoutes } from './routes/index';
import { AssistantPluginSetup, AssistantPluginStart, MessageParser } from './types';
import { BasicInputOutputParser } from './parsers/basic_input_output_parser';
import { VisualizationCardParser } from './parsers/visualization_card_parser';

export class AssistantPlugin implements Plugin<AssistantPluginSetup, AssistantPluginStart> {
  private readonly logger: Logger;
  private messageParsers: MessageParser[] = [];

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('Assistant: Setup');
    const config = await this.initializerContext.config
      .create<AssistantConfig>()
      .pipe(first())
      .toPromise();
    const router = core.http.createRouter();
    const openSearchObservabilityClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_observability',
      {
        plugins: [PPLPlugin, OpenSearchObservabilityPlugin, OpenSearchAlertingPlugin],
      }
    );

    core.http.registerRouteHandlerContext('assistant_plugin', (context, request) => {
      return {
        config,
        logger: this.logger,
        observabilityClient: openSearchObservabilityClient,
      };
    });

    // Register server side APIs
    setupRoutes(router, {
      messageParsers: this.messageParsers,
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
    this.logger.debug('Observability: Started');
    return {};
  }

  public stop() {}
}
