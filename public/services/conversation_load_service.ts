/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { HttpStart } from '../../../../src/core/public';
import { IConversation } from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';
import { DataSourceService } from './data_source_service';
import { ConversationsService } from './conversations_service';

export class ConversationLoadService {
  status$: BehaviorSubject<
    'idle' | 'loading' | { status: 'error'; error: Error }
  > = new BehaviorSubject<'idle' | 'loading' | { status: 'error'; error: Error }>('idle');
  abortController?: AbortController;
  private readonly conversationsService: ConversationsService;

  public get latestIdStatus$() {
    return this.conversationsService.status$;
  }

  constructor(private _http: HttpStart, private _dataSource: DataSourceService) {
    this.conversationsService = new ConversationsService(_http, _dataSource);
  }

  load = async (conversationId: string, nextToken?: string) => {
    this.abortController?.abort();
    this.status$.next('loading');
    this.abortController = new AbortController();
    try {
      const payload = await this._http.get<IConversation>(
        `${ASSISTANT_API.CONVERSATION}/${conversationId}`,
        {
          signal: this.abortController.signal,
          query: {
            ...this._dataSource.getDataSourceQuery(),
            nextToken,
          },
        }
      );
      this.status$.next('idle');
      return payload;
    } catch (error) {
      if (error.name === 'AbortError') {
        this.status$.next('idle');
        return;
      }
      this.status$.next({ status: 'error', error });
    }
  };

  getLatestConversationId = () => {
    return this.conversationsService
      .load({
        page: 1,
        perPage: 1,
        fields: ['createdTimeMs', 'updatedTimeMs', 'title'],
        sortField: 'updatedTimeMs',
        sortOrder: 'DESC',
        searchFields: ['title'],
      })
      .then(() => {
        return this.conversationsService.conversations$.getValue()?.objects[0].id;
      });
  };
}
