/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IMessage,
  ISession,
  ISessionFindResponse,
  Interaction,
} from '../../../common/types/chat_saved_object_attributes';
import { GetSessionsSchema } from '../../routes/chat_routes';

export interface StorageService {
  getInteraction(sessionId: string, interactionId: string): Promise<Interaction>;
  getSession(sessionId: string): Promise<ISession>;
  getSessions(query: GetSessionsSchema): Promise<ISessionFindResponse>;
  saveMessages(
    title: string,
    sessionId: string | undefined,
    messages: IMessage[]
  ): Promise<{ sessionId: string; messages: IMessage[] }>;
  deleteSession(sessionId: string): Promise<{}>;
  updateSession(sessionId: string, title: string): Promise<{}>;
}
