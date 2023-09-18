/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../src/core/server';
import {
  CHAT_SAVED_OBJECT,
  IChat,
  IMessage,
  SAVED_OBJECT_VERSION,
} from '../../common/types/chat_saved_object_attributes';
import { StorageService } from './storage_service';

export class SavedObjectsStorageService implements StorageService {
  constructor(private readonly client: SavedObjectsClientContract) {}

  public async getMessages(chatId: string) {
    const chatObject = await this.client.get<IChat>(CHAT_SAVED_OBJECT, chatId);
    return chatObject.attributes.messages;
  }

  public async saveMessages(
    title: string,
    chatId: string | undefined,
    messages: IMessage[]
  ): Promise<{ chatId: string; messages: IMessage[] }> {
    if (!chatId) {
      const createResponse = await this.client.create<IChat>(CHAT_SAVED_OBJECT, {
        title,
        version: SAVED_OBJECT_VERSION,
        createdTimeMs: new Date().getTime(),
        messages,
      });
      return { chatId: createResponse.id, messages: createResponse.attributes.messages };
    }
    const updateResponse = await this.client.update<Partial<IChat>>(CHAT_SAVED_OBJECT, chatId, {
      messages,
    });
    return { chatId, messages: updateResponse.attributes.messages! };
  }
}
