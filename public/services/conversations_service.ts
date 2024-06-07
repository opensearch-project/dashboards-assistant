/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { HttpFetchQuery, HttpStart, SavedObjectsFindOptions } from '../../../../src/core/public';
import { IConversationFindResponse } from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';
import { DataSourceService } from './data_source_service';

export class ConversationsService {
  conversations$: BehaviorSubject<IConversationFindResponse | null> = new BehaviorSubject<IConversationFindResponse | null>(
    null
  );
  status$: BehaviorSubject<'idle' | 'loading' | { error: Error }> = new BehaviorSubject<
    'idle' | 'loading' | { error: Error }
  >('idle');
  private _options?: Pick<
    SavedObjectsFindOptions,
    'page' | 'perPage' | 'fields' | 'sortField' | 'sortOrder'
  >;
  abortController?: AbortController;

  constructor(private _http: HttpStart, private _dataSource: DataSourceService) {}

  public get options() {
    return this._options;
  }

  load = async (
    query?: Pick<
      SavedObjectsFindOptions,
      'page' | 'perPage' | 'fields' | 'sortField' | 'sortOrder' | 'search' | 'searchFields'
    >
  ) => {
    this.abortController?.abort();
    this.abortController = new AbortController();
    this._options = query;
    try {
      this.status$.next('loading');
      this.conversations$.next(
        await this._http.get<IConversationFindResponse>(ASSISTANT_API.CONVERSATIONS, {
          query: {
            ...this._options,
            ...this._dataSource.getDataSourceQuery(),
          } as HttpFetchQuery,
          signal: this.abortController.signal,
        })
      );
      this.status$.next('idle');
    } catch (error) {
      this.conversations$.next(null);
      this.status$.next({ error });
    }
  };

  reload = () => {
    this.load(this._options);
  };
}
