/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransportRequestPromise, ApiResponse } from '@opensearch-project/opensearch/lib/Transport';
import { AgentFrameworkTrace } from '../../../common/utils/llm_chat/traces';
import { OpenSearchClient } from '../../../../../src/core/server';
import {
  IMessage,
  IConversation,
  IConversationFindResponse,
  Interaction,
  InteractionFromAgentFramework,
} from '../../../common/types/chat_saved_object_attributes';
import { GetConversationsSchema } from '../../routes/chat_routes';
import { StorageService } from './storage_service';
import { MessageParser } from '../../types';
import { MessageParserRunner } from '../../utils/message_parser_runner';
import { ML_COMMONS_BASE_API } from '../../utils/constants';
import { formatInteractionFromBackend } from '../../utils/format';

export interface ConversationOptResponse {
  success: boolean;
  statusCode?: number | null;
  message?: string;
}

export class AgentFrameworkStorageService implements StorageService {
  constructor(
    private readonly clientTransport: OpenSearchClient['transport'],
    private readonly messageParsers: MessageParser[] = []
  ) {}
  async getConversation(conversationId: string): Promise<IConversation> {
    const [interactionsResp, conversation] = await Promise.all([
      this.clientTransport.request({
        method: 'GET',
        path: `${ML_COMMONS_BASE_API}/memory/${encodeURIComponent(
          conversationId
        )}/messages?max_results=1000`,
      }) as TransportRequestPromise<
        ApiResponse<{
          messages: InteractionFromAgentFramework[];
        }>
      >,
      this.clientTransport.request({
        method: 'GET',
        path: `${ML_COMMONS_BASE_API}/memory/${encodeURIComponent(conversationId)}`,
      }) as TransportRequestPromise<
        ApiResponse<{
          conversation_id: string;
          create_time: string;
          updated_time: string;
          name: string;
        }>
      >,
    ]);
    const finalInteractions = interactionsResp.body.messages.map((item) =>
      formatInteractionFromBackend(item)
    );

    return {
      title: conversation.body.name,
      createdTimeMs: +new Date(conversation.body.create_time),
      updatedTimeMs: +new Date(conversation.body.updated_time),
      messages: await this.getMessagesFromInteractions(finalInteractions),
      interactions: finalInteractions,
    };
  }

  async getConversations(query: GetConversationsSchema): Promise<IConversationFindResponse> {
    let sortField = '';
    if (query.sortField === 'updatedTimeMs') {
      sortField = 'updated_time';
    } else if (query.sortField === 'createTimeMs') {
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

    const conversations = await this.clientTransport.request({
      method: 'GET',
      path: `${ML_COMMONS_BASE_API}/memory/_search`,
      body: requestParams,
    });

    return {
      objects: conversations.body.hits.hits
        .filter(
          (hit: {
            _source: { name: string; create_time: string; updated_time: string };
          }): hit is RequiredKey<typeof hit, '_source'> =>
            hit._source !== null && hit._source !== undefined
        )
        .map(
          (item: {
            _id: string;
            _source: { name: string; create_time: string; updated_time: string };
          }) => ({
            id: item._id,
            title: item._source.name,
            version: 1,
            createdTimeMs: Date.parse(item._source.create_time),
            updatedTimeMs: Date.parse(item._source.updated_time),
            messages: [] as IMessage[],
          })
        ),
      total:
        typeof conversations.body.hits.total === 'number'
          ? conversations.body.hits.total
          : conversations.body.hits.total.value,
    };
  }

  async saveMessages(
    title: string,
    conversationId: string | undefined,
    messages: IMessage[]
  ): Promise<{ conversationId: string; messages: IMessage[] }> {
    throw new Error('Method is not needed');
  }

  async deleteConversation(conversationId: string): Promise<ConversationOptResponse> {
    const response = await this.clientTransport.request({
      method: 'DELETE',
      path: `${ML_COMMONS_BASE_API}/memory/${encodeURIComponent(conversationId)}`,
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
  }

  async updateConversation(
    conversationId: string,
    title: string
  ): Promise<ConversationOptResponse> {
    const response = await this.clientTransport.request({
      method: 'PUT',
      path: `${ML_COMMONS_BASE_API}/memory/${encodeURIComponent(conversationId)}`,
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
  }

  async getTraces(interactionId: string): Promise<AgentFrameworkTrace[]> {
    const response = (await this.clientTransport.request({
      method: 'GET',
      path: `${ML_COMMONS_BASE_API}/memory/message/${encodeURIComponent(interactionId)}/traces`,
    })) as ApiResponse<{
      traces: Array<{
        message_id: string;
        create_time: string;
        input: string;
        response: string;
        origin: string;
        trace_number: number;
      }>;
    }>;

    return response.body.traces.map((item) => ({
      interactionId: item.message_id,
      input: item.input,
      output: item.response,
      createTime: item.create_time,
      origin: item.origin,
      traceNumber: item.trace_number,
    }));
  }

  async updateInteraction(
    interactionId: string,
    additionalInfo: Record<string, Record<string, boolean | string>>
  ): Promise<ConversationOptResponse> {
    const response = await this.clientTransport.request({
      method: 'PUT',
      path: `${ML_COMMONS_BASE_API}/memory/message/${encodeURIComponent(interactionId)}`,
      body: {
        additional_info: additionalInfo,
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
  }

  public async getMessagesFromInteractions(interactions: Interaction[]): Promise<IMessage[]> {
    const messageParserRunner = new MessageParserRunner(this.messageParsers);
    const finalInteractions = [...interactions];

    let finalMessages: IMessage[] = [];
    for (const interaction of finalInteractions) {
      finalMessages = [
        ...finalMessages,
        ...(await messageParserRunner.run(interaction, {
          interactions: [...(finalInteractions || [])],
        })),
      ];
    }

    return finalMessages;
  }

  async getInteraction(conversationId: string, interactionId: string): Promise<Interaction> {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    if (!interactionId) {
      throw new Error('interactionId is required');
    }
    const interactionsResp = (await this.clientTransport.request({
      method: 'GET',
      path: `${ML_COMMONS_BASE_API}/memory/message/${encodeURIComponent(interactionId)}`,
    })) as ApiResponse<InteractionFromAgentFramework>;
    return formatInteractionFromBackend(interactionsResp.body);
  }
}
