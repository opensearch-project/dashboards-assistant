/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Interaction,
  InteractionFromAgentFramework,
} from '../../common/types/chat_saved_object_attributes';

/**
 * Agent framework changes interaction_id to message_id
 * In FE we need to change this back.
 */
export const formatInteractionFromBackend = (
  interaction: InteractionFromAgentFramework
): Interaction => {
  const { message_id: messageId, memory_id: memoryId, ...others } = interaction || {};
  return {
    ...others,
    interaction_id: messageId || '',
    conversation_id: memoryId || '',
  };
};
