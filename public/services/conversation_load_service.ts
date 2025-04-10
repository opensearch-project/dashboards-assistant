/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { HttpStart } from '../../../../src/core/public';
import { IConversation } from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';
import { DataSourceService } from './data_source_service';
import { UsageCollectionSetup } from '../../../../src/plugins/usage_collection/public/plugin';
import { reportMetric } from '../utils/report_metric';
import {
  CHAT_APP_NAME,
  CHAT_METRIC_GET_CONVERSATION_FAILURE,
  CHAT_METRIC_GET_CONVERSATION_SUCCESS,
} from '../../common/constants/metrics';

export class ConversationLoadService {
  status$: BehaviorSubject<
    'idle' | 'loading' | { status: 'error'; error: Error }
  > = new BehaviorSubject<'idle' | 'loading' | { status: 'error'; error: Error }>('idle');
  abortController?: AbortController;

  constructor(
    private _http: HttpStart,
    private _dataSource: DataSourceService,
    private usageCollection?: UsageCollectionSetup
  ) {}

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
      reportMetric(this.usageCollection, CHAT_APP_NAME, CHAT_METRIC_GET_CONVERSATION_SUCCESS);
      return payload;
    } catch (error) {
      reportMetric(this.usageCollection, CHAT_APP_NAME, CHAT_METRIC_GET_CONVERSATION_FAILURE);
      this.status$.next({ status: 'error', error });
    }
  };
}
