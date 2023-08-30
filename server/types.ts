/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyClusterClient, Logger } from '../../../src/core/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantPluginStart {}

declare module '../../../src/core/server' {
  interface RequestHandlerContext {
    assistant_plugin: {
      observabilityClient: ILegacyClusterClient;
      logger: Logger;
    };
  }
}
