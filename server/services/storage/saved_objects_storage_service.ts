/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageParser } from '../../types';
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
  constructor(
    private readonly client: SavedObjectsClientContract,
    private readonly messageParsers: MessageParser[]
  ) {}

  private convertUpdatedTimeField(updatedAt: string | undefined) {
    return updatedAt ? new Date(updatedAt).getTime() : undefined;
  }

  async getSession(sessionId: string): Promise<ISession> {
    const session = await this.client.get<ISession>(CHAT_SAVED_OBJECT, sessionId);
    if (session.error) throw session.error;
    return {
      ...session.attributes,
      ...(session.updated_at && {
        updatedTimeMs: this.convertUpdatedTimeField(session.updated_at),
      }),
    };
  }

  async getSessions(query: GetSessionsSchema): Promise<ISessionFindResponse> {
    const sessions = await this.client.find<ISession>({
      ...query,
      // saved objects by default provides updated_at field
      ...(query.sortField === 'updatedTimeMs' && { sortField: 'updated_at' }),
      type: CHAT_SAVED_OBJECT,
      searchFields:
        typeof query.searchFields === 'string' ? [query.searchFields] : query.searchFields,
    });
    return {
      objects: sessions.saved_objects.map((session) => ({
        ...session.attributes,
        ...(session.updated_at && {
          updatedTimeMs: this.convertUpdatedTimeField(session.updated_at),
        }),
        id: session.id,
      })),
      total: sessions.total,
    };
  }

  public async saveMessages(
    title: string,
    sessionId: string | undefined,
    messages: IMessage[]
  ): Promise<{ sessionId: string; messages: IMessage[] }> {
    if (!sessionId) {
      const createResponse = await this.client.create<Omit<ISession, 'updatedTimeMs'>>(
        CHAT_SAVED_OBJECT,
        {
          title,
          version: SAVED_OBJECT_VERSION,
          createdTimeMs: new Date().getTime(),
          messages,
        }
      );
      return { sessionId: createResponse.id, messages: createResponse.attributes.messages };
    }
    const updateResponse = await this.client.update<Partial<ISession>>(
      CHAT_SAVED_OBJECT,
      sessionId,
      { messages }
    );
    return { sessionId, messages: updateResponse.attributes.messages! };
  }

  deleteSession(sessionId: string) {
    return this.client.delete(CHAT_SAVED_OBJECT, sessionId);
  }

  updateSession(sessionId: string, title: string) {
    return this.client.update(CHAT_SAVED_OBJECT, sessionId, {
      title,
    });
  }
}
