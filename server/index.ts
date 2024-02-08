/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../src/core/server';
import { AssistantPlugin } from './plugin';
import { configSchema, ConfigSchema } from '../common/types/config';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    chat: true,
    incontextInsight: true,
  },
  schema: configSchema,
};

export const plugin = (initContext: PluginInitializerContext) => new AssistantPlugin(initContext);

export { AssistantPluginSetup, AssistantPluginStart, MessageParser } from './types';
