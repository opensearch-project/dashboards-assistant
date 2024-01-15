/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IMessage,
  IConversation,
  IConversationFindResponse,
  Interaction,
} from '../../../common/types/chat_saved_object_attributes';
import { GetConversationsSchema } from '../../routes/chat_routes';

export interface StorageService {
  getInteraction(conversationId: string, interactionId: string): Promise<Interaction>;
  getConversation(conversationId: string): Promise<IConversation>;
  getConversations(query: GetConversationsSchema): Promise<IConversationFindResponse>;
  saveMessages(
    title: string,
    conversationId: string | undefined,
    messages: IMessage[]
  ): Promise<{ conversationId: string; messages: IMessage[] }>;
  deleteConversation(conversationId: string): Promise<{}>;
  updateConversation(conversationId: string, title: string): Promise<{}>;
}
