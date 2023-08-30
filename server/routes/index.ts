/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyClusterClient, IRouter } from '../../../../src/core/server';
import { registerChatRoute } from './llm_chat/chat_router';
import { registerLangChainRoutes } from './llm_chat/langchain';

export function setupRoutes({ router, client }: { router: IRouter; client: ILegacyClusterClient }) {
  registerChatRoute(router);
  registerLangChainRoutes(router);
}
