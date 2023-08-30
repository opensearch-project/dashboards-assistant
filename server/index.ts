/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../src/core/server';
import { AssistantPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new AssistantPlugin(initializerContext);
}

export { AssistantPluginSetup, AssistantPluginStart } from './types';
