/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { HttpFetchQuery, HttpStart, SavedObjectsFindOptions } from '../../../../src/core/public';
import {
  IConversationFindResponse,
  IMessage,
  SendResponse,
} from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';
import { DataSourceService } from './data_source_service';
import { UsageCollectionSetup } from '../../../../src/plugins/usage_collection/public/plugin';
import { reportMetric } from '../utils/report_metric';
import {
  CHAT_APP_NAME,
  CHAT_METRIC_LIST_CONVERSATIONS_FAILURE,
  CHAT_METRIC_LIST_CONVERSATIONS_SUCCESS,
  CHAT_METRIC_SEND_MESSAGE_FAILURE,
  CHAT_METRIC_SEND_MESSAGE_SUCCESS,
} from '../../common/constants/metrics';

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

  constructor(
    private _http: HttpStart,
    private _dataSource: DataSourceService,
    private usageCollection?: UsageCollectionSetup
  ) {}

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
      reportMetric(this.usageCollection, CHAT_APP_NAME, CHAT_METRIC_LIST_CONVERSATIONS_SUCCESS);
    } catch (error) {
      this.conversations$.next(null);
      this.status$.next({ error });
      reportMetric(this.usageCollection, CHAT_APP_NAME, CHAT_METRIC_LIST_CONVERSATIONS_FAILURE);
    }
  };

  reload = () => {
    this.load(this._options);
  };

  sendMessage = async (input: IMessage, messages: IMessage[], conversationId?: string) => {
    try {
      const response = await this._http.post<SendResponse>(ASSISTANT_API.SEND_MESSAGE, {
        // do not send abort signal to http client to allow LLM call run in background
        body: JSON.stringify({
          conversationId,
          ...(!conversationId && { messages }), // include all previous messages for new chats
          input,
        }),
        query: this._dataSource.getDataSourceQuery(),
      });
      reportMetric(this.usageCollection, CHAT_APP_NAME, CHAT_METRIC_SEND_MESSAGE_SUCCESS);
      return response;
    } catch (error) {
      reportMetric(this.usageCollection, CHAT_APP_NAME, CHAT_METRIC_SEND_MESSAGE_FAILURE);
      throw error;
    }
  };
}
