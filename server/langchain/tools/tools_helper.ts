/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginToolsFactory } from './tools_factory/tools_factory';
import { OSAlertingTools } from './tool_sets/aleritng_apis';
import { KnowledgeTools } from './tool_sets/knowledges';
import { OSAPITools } from './tool_sets/os_apis';
import { PPLTools } from './tool_sets/ppl';
import { SavedObjectsTools } from './tool_sets/saved_objects';
import { TracesTools } from './tool_sets/traces';

export const initTools = (
  // proper way to get parameters possibly needs typescript 4.2 https://github.com/microsoft/TypeScript/issues/35576
  ...args: ConstructorParameters<typeof PluginToolsFactory & { prototype: unknown }>
): PluginToolsFactory[] => {
  const pplTools = new PPLTools(...args);
  const alertingTools = new OSAlertingTools(...args);
  const knowledgeTools = new KnowledgeTools(...args);
  const opensearchTools = new OSAPITools(...args);
  const savedObjectsTools = new SavedObjectsTools(...args);
  const tracesTools = new TracesTools(...args);
  return [pplTools, alertingTools, knowledgeTools, opensearchTools, savedObjectsTools, tracesTools];
};
