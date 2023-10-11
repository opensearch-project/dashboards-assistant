/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IMessage,
  ISession,
  ISessionFindResponse,
} from '../../../common/types/chat_saved_object_attributes';
import { GetSessionsSchema } from '../../routes/chat_routes';

export interface StorageService {
  getSession(sessionID: string): Promise<ISession>;
  getSessions(query: GetSessionsSchema): Promise<ISessionFindResponse>;
  saveMessages(
    title: string,
    sessionID: string | undefined,
    messages: IMessage[]
  ): Promise<{ sessionID: string; messages: IMessage[] }>;
}
