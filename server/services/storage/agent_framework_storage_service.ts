/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransportRequestPromise, ApiResponse } from '@opensearch-project/opensearch/lib/Transport';
import { AgentFrameworkTrace } from '../../../common/utils/llm_chat/traces';
import { OpenSearchClient } from '../../../../../src/core/server';
import {
  IMessage,
  ISession,
  ISessionFindResponse,
  Interaction,
} from '../../../common/types/chat_saved_object_attributes';
import { GetSessionsSchema } from '../../routes/chat_routes';
import { StorageService } from './storage_service';
import { MessageParser } from '../../types';
import { MessageParserRunner } from '../../utils/message_parser_runner';
import { ML_COMMONS_BASE_API } from '../../olly/models/constants';

export interface SessionOptResponse {
  success: boolean;
  statusCode?: number | null;
  message?: string;
}

export class AgentFrameworkStorageService implements StorageService {
  constructor(
    private readonly client: OpenSearchClient,
    private readonly messageParsers: MessageParser[] = []
  ) {}
  async getSession(sessionId: string): Promise<ISession> {
    const [interactionsResp, conversation] = await Promise.all([
      this.client.transport.request({
        method: 'GET',
        path: `${ML_COMMONS_BASE_API}/memory/conversation/${sessionId}/_list`,
      }) as TransportRequestPromise<
        ApiResponse<{
          interactions: Interaction[];
        }>
      >,
      this.client.transport.request({
        method: 'GET',
        path: `${ML_COMMONS_BASE_API}/memory/conversation/${sessionId}`,
      }) as TransportRequestPromise<
        ApiResponse<{
          conversation_id: string;
          create_time: string;
          updated_time: string;
          name: string;
        }>
      >,
    ]);
    const messageParserRunner = new MessageParserRunner(this.messageParsers);
    const finalInteractions: Interaction[] = [...interactionsResp.body.interactions];

    let finalMessages: IMessage[] = [];
    for (const interaction of finalInteractions) {
      finalMessages = [...finalMessages, ...(await messageParserRunner.run(interaction))];
    }
    return {
      title: conversation.body.name,
      createdTimeMs: +new Date(conversation.body.create_time),
      updatedTimeMs: +new Date(conversation.body.updated_time),
      messages: finalMessages,
      interactions: finalInteractions,
    };
  }

  // TODO: return real update_time in the response once the agent framework supports update_time field
  async getSessions(query: GetSessionsSchema): Promise<ISessionFindResponse> {
    let sortField = '';
    if (query.sortField === 'updatedTimeMs') {
      sortField = 'create_time';
    }
    let searchFields: string[] = [];
    if (query.search && query.searchFields) {
      if (typeof query.searchFields === 'string') {
        searchFields = [...searchFields, query.searchFields.replace('title', 'name')];
      } else {
        searchFields = query.searchFields.map((item) => item.replace('title', 'name'));
      }
    }

    const requestParams = {
      from: (query.page - 1) * query.perPage,
      size: query.perPage,
      ...(searchFields.length > 0 && {
        query: {
          multi_match: {
            query: query.search,
            fields: searchFields,
          },
        },
      }),
      ...(searchFields.length === 0 && {
        query: {
          match_all: {},
        },
      }),
      ...(sortField && query.sortOrder && { sort: [{ [sortField]: query.sortOrder }] }),
    };

    const sessions = await this.client.transport.request({
      method: 'GET',
      path: `${ML_COMMONS_BASE_API}/memory/conversation/_search`,
      body: requestParams,
    });

    return {
      objects: sessions.body.hits.hits
        .filter(
          (hit: {
            _source: { name: string; create_time: string };
          }): hit is RequiredKey<typeof hit, '_source'> =>
            hit._source !== null && hit._source !== undefined
        )
        .map((item: { _id: string; _source: { name: string; create_time: string } }) => ({
          id: item._id,
          title: item._source.name,
          version: 1,
          createdTimeMs: Date.parse(item._source.create_time),
          updatedTimeMs: Date.parse(item._source.create_time),
          messages: [] as IMessage[],
        })),
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
    throw new Error('Method is not needed');
  }

  async deleteSession(sessionId: string): Promise<SessionOptResponse> {
    try {
      const response = await this.client.transport.request({
        method: 'DELETE',
        path: `${ML_COMMONS_BASE_API}/memory/conversation/${sessionId}/_delete`,
      });
      if (response.statusCode === 200) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          statusCode: response.statusCode,
          message: JSON.stringify(response.body),
        };
      }
    } catch (error) {
      throw new Error('delete converstaion failed, reason:' + JSON.stringify(error.meta?.body));
    }
  }

  async updateSession(sessionId: string, title: string): Promise<SessionOptResponse> {
    try {
      const response = await this.client.transport.request({
        method: 'PUT',
        path: `${ML_COMMONS_BASE_API}/memory/conversation/${sessionId}/_update`,
        body: {
          name: title,
        },
      });
      if (response.statusCode === 200) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          statusCode: response.statusCode,
          message: JSON.stringify(response.body),
        };
      }
    } catch (error) {
      throw new Error('update converstaion failed, reason:' + JSON.stringify(error.meta?.body));
    }
  }

  async getTraces(interactionId: string): Promise<AgentFrameworkTrace[]> {
    try {
      const response = (await this.client.transport.request({
        method: 'GET',
        path: `${ML_COMMONS_BASE_API}/memory/trace/${interactionId}/_list`,
      })) as ApiResponse<{
        traces: Array<{
          conversation_id: string;
          interaction_id: string;
          create_time: string;
          input: string;
          response: string;
          origin: string;
          parent_interaction_id: string;
          trace_number: number;
        }>;
      }>;

      return response.body.traces.map((item) => ({
        interactionId: item.interaction_id,
        parentInteractionId: item.parent_interaction_id,
        input: item.input,
        output: item.response,
        createTime: item.create_time,
        origin: item.origin,
        traceNumber: item.trace_number,
      }));
    } catch (error) {
      throw new Error('get traces failed, reason:' + JSON.stringify(error.meta?.body));
    }
  }
}
