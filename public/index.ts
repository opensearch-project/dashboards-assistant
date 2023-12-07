/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../src/core/public';
import { AssistantPlugin, PalantirComponent } from './plugin';
import { AssistantSetup, AssistantStart, Palantir } from './types';

export {
  AssistantPlugin as Plugin,
  AssistantSetup as AssistantPublicPluginSetup,
  AssistantStart as AssistantPublicPluginStart,
  Palantir,
  PalantirComponent,
};

export * from './services';

export function plugin(initializerContext: PluginInitializerContext) {
  return new AssistantPlugin(initializerContext);
}

export { AssistantSetup, RenderProps } from './types';
export { IMessage } from '../common/types/chat_saved_object_attributes';
