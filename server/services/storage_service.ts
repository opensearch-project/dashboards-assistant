/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../common/types/chat_saved_object_attributes';

export interface StorageService {
  getMessages(chatId: string): Promise<IMessage[]>;
  saveMessages(
    title: string,
    chatId: string | undefined,
    messages: IMessage[]
  ): Promise<{ chatId: string; messages: IMessage[] }>;
}
