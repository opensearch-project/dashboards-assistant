/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch/.';
import { OpenSearchClient } from '../../../../../src/core/server';
import { LLM_INDEX } from '../../../common/constants/llm';
import {
  IInput,
  IMessage,
  IOutput,
  ISession,
  ISessionFindResponse,
} from '../../../common/types/chat_saved_object_attributes';
import { GetSessionsSchema } from '../../routes/chat_routes';
import { StorageService } from './storage_service';

export class AgentFrameworkStorageService implements StorageService {
  constructor(private readonly client: OpenSearchClient) {}
  async getSession(sessionId: string): Promise<ISession> {
    const session = (await this.client.transport.request({
      method: 'GET',
      path: `/_plugins/_ml/memory/conversation/${sessionId}`,
    })) as ApiResponse<{
      interactions: Array<{
        input: string;
        response: string;
        parent_interaction_id: string;
        interaction_id: string;
      }>;
    }>;
    return {
      title: 'test',
      version: 1,
      createdTimeMs: Date.now(),
      updatedTimeMs: Date.now(),
      messages: session.body.interactions
        .filter((item) => !item.parent_interaction_id)
        .reduce((total, current) => {
          const inputItem: IInput = {
            type: 'input',
            contentType: 'text',
            content: current.input,
          };
          const outputItems: IOutput[] = [
            {
              type: 'output',
              contentType: 'markdown',
              content: current.response,
              traceId: current.interaction_id,
            },
          ];
          return [...total, inputItem, ...outputItems];
        }, [] as IMessage[]),
    };
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
    sessionId: string | undefined,
    messages: IMessage[]
  ): Promise<{ sessionId: string; messages: IMessage[] }> {
    await this.createIndex();
    const timestamp = new Date().getTime();
    if (!sessionId) {
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
      return { sessionId: createResponse.body._id, messages };
    }
    const updateResponse = await this.client.update<Partial<ISession>>({
      index: LLM_INDEX.SESSIONS,
      id: sessionId,
      body: {
        doc: {
          messages,
          updatedTimeMs: timestamp,
        },
      },
    });
    return { sessionId, messages };
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
  deleteSession(sessionId: string): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  updateSession(sessionId: string, title: string): Promise<{}> {
    throw new Error('Method not implemented.');
  }
}
