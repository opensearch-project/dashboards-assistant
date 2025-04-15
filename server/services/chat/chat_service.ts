/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stream } from 'stream';
import { RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';

export interface ChatService {
  requestLLM(
    payload: { messages: IMessage[]; input: IInput; conversationId?: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    conversationId: string;
    interactionId: string;
    stream?: Stream; // This is the stream to update the message
  }>;

  regenerate(
    payload: { conversationId: string; interactionId: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    conversationId: string;
    interactionId: string;
  }>;

  abortAgentExecution(conversationId: string): void;
}
