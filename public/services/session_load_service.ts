/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { HttpStart } from '../../../../src/core/public';
import { ISession } from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';

export class SessionLoadService {
  status$: BehaviorSubject<
    'idle' | 'loading' | { status: 'error'; error: Error }
  > = new BehaviorSubject<'idle' | 'loading' | { status: 'error'; error: Error }>('idle');
  abortController?: AbortController;

  constructor(private _http: HttpStart) {}

  load = async (sessionId: string) => {
    this.abortController?.abort();
    this.status$.next('loading');
    this.abortController = new AbortController();
    try {
      const payload = await this._http.get<ISession>(`${ASSISTANT_API.SESSION}/${sessionId}`, {
        signal: this.abortController.signal,
      });
      this.status$.next('idle');
      return payload;
    } catch (error) {
      this.status$.next({ status: 'error', error });
    }
  };
}
