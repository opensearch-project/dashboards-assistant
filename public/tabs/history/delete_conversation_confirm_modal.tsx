/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';

import { EuiConfirmModal, EuiText } from '@elastic/eui';

import { useDeleteConversation } from '../../hooks/use_conversations';

interface DeleteConversationConfirmModalProps {
  onClose?: (status: 'canceled' | 'errored' | 'deleted') => void;
  conversationId: string;
}

export const DeleteConversationConfirmModal = ({
  onClose,
  conversationId,
}: DeleteConversationConfirmModalProps) => {
  const { loading, deleteConversation, abort } = useDeleteConversation();

  const handleCancel = useCallback(() => {
    abort();
    onClose?.('canceled');
  }, [onClose, abort]);
  const handleConfirm = useCallback(async () => {
    try {
      await deleteConversation(conversationId);
    } catch (_e) {
      onClose?.('errored');
      return;
    }
    onClose?.('deleted');
  }, [onClose, deleteConversation, conversationId]);

  return (
    <EuiConfirmModal
      title="Delete conversation"
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      cancelButtonText="Cancel"
      confirmButtonText="Delete conversation"
      buttonColor="danger"
      maxWidth={400}
      confirmButtonDisabled={loading}
      isLoading={loading}
    >
      <EuiText>
        <p>
          Are you sure you want to delete the conversation? After it’s deleted, the conversation
          details will not be accessible.
        </p>
      </EuiText>
    </EuiConfirmModal>
  );
};
