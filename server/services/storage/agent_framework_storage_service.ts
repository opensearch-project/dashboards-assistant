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
    throw new Error('Method not implemented.');
  }

  async saveMessages(
    title: string,
    sessionId: string | undefined,
    messages: IMessage[]
  ): Promise<{ sessionId: string; messages: IMessage[] }> {
    throw new Error('Method not implemented.');
  }
  deleteSession(sessionId: string): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  updateSession(sessionId: string, title: string): Promise<{}> {
    throw new Error('Method not implemented.');
  }
}
