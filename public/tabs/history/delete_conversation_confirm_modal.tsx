/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';

import { EuiConfirmModal, EuiText } from '@elastic/eui';

import { useDeleteConversation } from '../../hooks';
import { useCore } from '../../contexts/core_context';

export interface DeleteConversationConfirmModalProps {
  onClose?: (status: 'cancelled' | 'errored' | 'deleted') => void;
  conversationId: string;
}

export const DeleteConversationConfirmModal = ({
  onClose,
  conversationId,
}: DeleteConversationConfirmModalProps) => {
  const {
    services: {
      notifications: { toasts },
    },
  } = useCore();
  const { loading, deleteConversation, abort, isAborted } = useDeleteConversation();

  const handleCancel = useCallback(() => {
    abort();
    onClose?.('cancelled');
  }, [onClose, abort]);
  const handleConfirm = useCallback(async () => {
    try {
      await deleteConversation(conversationId);
      toasts.addSuccess('The conversation was successfully deleted.');
    } catch (_e) {
      if (isAborted()) {
        return;
      }
      onClose?.('errored');
      toasts.addDanger('There was an error. The conversation failed to delete.');
      return;
    }
    onClose?.('deleted');
  }, [onClose, deleteConversation, conversationId, toasts.addSuccess, toasts.addDanger, isAborted]);

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
