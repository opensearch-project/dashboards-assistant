/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../src/core/public';
import { AssistantPlugin } from './plugin';

export { AssistantPlugin as Plugin };

export function plugin(initializerContext: PluginInitializerContext) {
  return new AssistantPlugin(initializerContext);
}

export { AssistantSetup, RenderProps } from './types';
