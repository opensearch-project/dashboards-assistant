/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyClusterClient, Logger } from '../../../src/core/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ObservabilityPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ObservabilityPluginStart {}

declare module '../../../src/core/server' {
  interface RequestHandlerContext {
    observability_plugin: {
      observabilityClient: ILegacyClusterClient;
      logger: Logger;
    };
  }
}
