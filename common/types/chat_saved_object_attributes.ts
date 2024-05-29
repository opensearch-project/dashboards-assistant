/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const CHAT_SAVED_OBJECT = 'assistant-chat';
export const SAVED_OBJECT_VERSION = 1;

export interface Interaction {
  input: string;
  response: string;
  conversation_id: string;
  interaction_id: string;
  create_time: string;
  additional_info?: { feedback?: SendFeedbackBody; [key: string]: unknown };
}

export type InteractionFromAgentFramework = Omit<
  Interaction,
  'interaction_id' | 'conversation_id'
> & {
  message_id: string;
  memory_id: string;
};

export interface IConversation {
  title: string;
  version?: number;
  createdTimeMs: number;
  updatedTimeMs: number;
  messages: IMessage[];
  interactions: Interaction[];
}

export interface IConversationFindResponse {
  objects: Array<IConversation & { id: string }>;
  total: number;
}

export interface IInput {
  type: 'input';
  contentType: 'text';
  content: string;
  context?: {
    appId?: string;
    content?: string;
    datasourceId?: string;
  };
  messageId?: string;
}
export interface IOutput {
  type: 'output';
  interactionId?: string; // used for tracing agent calls
  toolsUsed?: string[];
  contentType: 'error' | 'markdown' | 'visualization' | string;
  content: string;
  suggestedActions?: ISuggestedAction[];
  messageId?: string;
  fullWidth?: boolean;
}
export type IMessage = IInput | IOutput;

interface ISuggestedActionBase {
  actionType: string;
  message: string;
}
export type ISuggestedAction = ISuggestedActionBase &
  (
    | { actionType: 'send_as_input' | 'copy' | 'view_in_dashboards' }
    | {
        actionType: 'view_ppl_visualization';
        metadata: { query: string; question: string };
      }
    | {
        actionType: 'view_trace';
        metadata: { interactionId: string };
      }
  );
export interface SendFeedbackBody {
  satisfaction: boolean;
}

export interface SendResponse {
  conversationId: string;
  title?: string;
  messages: IMessage[];
  interactions: Interaction[];
}
