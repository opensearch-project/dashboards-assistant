/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../../src/core/server';
import {
  CHAT_SAVED_OBJECT,
  IMessage,
  ISession,
  ISessionFindResponse,
  SAVED_OBJECT_VERSION,
} from '../../../common/types/chat_saved_object_attributes';
import { GetSessionsSchema } from '../../routes/chat_routes';
import { StorageService } from './storage_service';

export class SavedObjectsStorageService implements StorageService {
  constructor(private readonly client: SavedObjectsClientContract) {}

  async getSession(sessionID: string): Promise<ISession> {
    const session = await this.client.get<ISession>(CHAT_SAVED_OBJECT, sessionID);
    if (session.error) throw session.error;
    return session.attributes;
  }

  async getSessions(query: GetSessionsSchema): Promise<ISessionFindResponse> {
    return this.client.find<ISession>({
      ...query,
      type: CHAT_SAVED_OBJECT,
    });
  }

  public async saveMessages(
    title: string,
    sessionID: string | undefined,
    messages: IMessage[]
  ): Promise<{ sessionID: string; messages: IMessage[] }> {
    if (!sessionID) {
      const createResponse = await this.client.create<ISession>(CHAT_SAVED_OBJECT, {
        title,
        version: SAVED_OBJECT_VERSION,
        createdTimeMs: new Date().getTime(),
        messages,
      });
      return { sessionID: createResponse.id, messages: createResponse.attributes.messages };
    }
    const updateResponse = await this.client.update<Partial<ISession>>(
      CHAT_SAVED_OBJECT,
      sessionID,
      {
        messages,
      }
    );
    return { sessionID, messages: updateResponse.attributes.messages! };
  }
}
