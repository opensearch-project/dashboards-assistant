/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { PluginConfigDescriptor, PluginInitializerContext } from '../../../src/core/server';
import { AssistantPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new AssistantPlugin(initializerContext);
}

export { AssistantPluginSetup, AssistantPluginStart, MessageParser } from './types';

const assistantConfig = {
  schema: schema.object({
    chat: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
      rootAgentName: schema.maybe(schema.string()),
    }),
  }),
};

export type AssistantConfig = TypeOf<typeof assistantConfig.schema>;

export const config: PluginConfigDescriptor<AssistantConfig> = {
  schema: assistantConfig.schema,
  exposeToBrowser: {
    chat: true,
  },
};
