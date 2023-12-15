/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { HttpFetchQuery, HttpStart, SavedObjectsFindOptions } from '../../../../src/core/public';
import { ISessionFindResponse } from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';

export class SessionsService {
  sessions$: BehaviorSubject<ISessionFindResponse | null> = new BehaviorSubject<ISessionFindResponse | null>(
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

  constructor(private _http: HttpStart) {}

  public get options() {
    return this._options;
  }

  load = async (
    query?: Pick<SavedObjectsFindOptions, 'page' | 'perPage' | 'fields' | 'sortField' | 'sortOrder'>
  ) => {
    this.abortController?.abort();
    this.abortController = new AbortController();
    this._options = query;
    try {
      this.status$.next('loading');
      this.sessions$.next(
        await this._http.get<ISessionFindResponse>(ASSISTANT_API.SESSIONS, {
          query: this._options as HttpFetchQuery,
          signal: this.abortController.signal,
        })
      );
      this.status$.next('idle');
    } catch (error) {
      this.sessions$.next(null);
      this.status$.next({ error });
    }
  };

  reload = () => {
    this.load(this._options);
  };
}
