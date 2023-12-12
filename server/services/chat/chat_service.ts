/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { LLMRequestSchema } from '../../routes/chat_routes';

export interface ChatService {
  requestLLM(
    payload: { messages: IMessage[]; input: IInput; sessionId?: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    memoryId: string;
  }>;

  regenerate(
    payload: { sessionId: string; interactionId: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    memoryId: string;
  }>;

  abortAgentExecution(sessionId: string): void;
}
