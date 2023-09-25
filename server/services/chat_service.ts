/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../src/core/server';
import { IMessage } from '../../common/types/chat_saved_object_attributes';
import { LLMRequestSchema } from '../routes/chat_routes';
import { PPLGenerationRequestSchema } from '../routes/langchain_routes';
import { StorageService } from './storage_service';

export interface ChatService {
  requestLLM(
    messages: IMessage[],
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, LLMRequestSchema, 'post'>
  ): Promise<IMessage[]>;
  generatePPL(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, PPLGenerationRequestSchema, 'post'>
  ): Promise<string>;
}
