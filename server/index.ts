/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: user work flow. recording on chime
// what the user should see from link start to end of workflow
// drop the link for the demo that the user should test
// demo endpoint through cloudfront end of week
// links for toolkit info
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
