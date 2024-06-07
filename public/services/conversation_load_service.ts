/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { HttpStart } from '../../../../src/core/public';
import { IConversation } from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';
import { DataSourceService } from './data_source_service';

export class ConversationLoadService {
  status$: BehaviorSubject<
    'idle' | 'loading' | { status: 'error'; error: Error }
  > = new BehaviorSubject<'idle' | 'loading' | { status: 'error'; error: Error }>('idle');
  abortController?: AbortController;

  constructor(private _http: HttpStart, private _dataSource: DataSourceService) {}

  load = async (conversationId: string) => {
    this.abortController?.abort();
    this.status$.next('loading');
    this.abortController = new AbortController();
    try {
      const payload = await this._http.get<IConversation>(
        `${ASSISTANT_API.CONVERSATION}/${conversationId}`,
        {
          signal: this.abortController.signal,
          query: this._dataSource.getDataSourceQuery(),
        }
      );
      this.status$.next('idle');
      return payload;
    } catch (error) {
      this.status$.next({ status: 'error', error });
    }
  };
}
