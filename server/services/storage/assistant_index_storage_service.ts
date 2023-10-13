/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../../src/core/server';
import { LLM_INDEX } from '../../../common/constants/llm';
import {
  IMessage,
  ISession,
  ISessionFindResponse,
} from '../../../common/types/chat_saved_object_attributes';
import { GetSessionsSchema } from '../../routes/chat_routes';
import { StorageService } from './storage_service';

export class AssistantIndexStorageService implements StorageService {
  constructor(private readonly client: OpenSearchClient) {}
  async getSession(sessionID: string): Promise<ISession> {
    const session = await this.client.get<ISession>({
      index: LLM_INDEX.SESSIONS,
      id: sessionID,
    });
    if (!session.body._source) throw new Error('Session not found');
    return session.body._source;
  }

  async getSessions(query: GetSessionsSchema): Promise<ISessionFindResponse> {
    await this.createIndex();
    const sessions = await this.client.search<ISession>({
      index: LLM_INDEX.SESSIONS,
      body: {
        from: (query.page - 1) * query.perPage,
        size: query.perPage,
        ...(query.sortField &&
          query.sortOrder && { sort: [{ [query.sortField]: query.sortOrder }] }),
      },
    });

    return {
      objects: sessions.body.hits.hits
        .filter(
          (hit): hit is RequiredKey<typeof hit, '_source'> =>
            hit._source !== null && hit._source !== undefined
        )
        .map((session) => ({ ...session._source, id: session._id })),
      total:
        typeof sessions.body.hits.total === 'number'
          ? sessions.body.hits.total
          : sessions.body.hits.total.value,
    };
  }

  async saveMessages(
    title: string,
    sessionID: string | undefined,
    messages: IMessage[]
  ): Promise<{ sessionID: string; messages: IMessage[] }> {
    await this.createIndex();
    const timestamp = new Date().getTime();
    if (!sessionID) {
      const createResponse = await this.client.index<ISession>({
        index: LLM_INDEX.SESSIONS,
        body: {
          title,
          version: 1,
          createdTimeMs: timestamp,
          updatedTimeMs: timestamp,
          messages,
        },
      });
      return { sessionID: createResponse.body._id, messages };
    }
    const updateResponse = await this.client.update<Partial<ISession>>({
      index: LLM_INDEX.SESSIONS,
      id: sessionID,
      body: {
        doc: {
          messages,
          updatedTimeMs: timestamp,
        },
      },
    });
    return { sessionID, messages };
  }

  private async createIndex() {
    const existsResponse = await this.client.indices.exists({ index: LLM_INDEX.SESSIONS });
    if (!existsResponse.body) {
      return this.client.indices.create({
        index: LLM_INDEX.SESSIONS,
        body: {
          settings: {
            index: {
              number_of_shards: '1',
              auto_expand_replicas: '0-2',
              mapping: { ignore_malformed: true },
            },
          },
          mappings: {
            properties: {
              title: { type: 'keyword' },
              createdTimeMs: { type: 'date' },
              updatedTimeMs: { type: 'date' },
            },
          },
        },
      });
    }
  }
}
