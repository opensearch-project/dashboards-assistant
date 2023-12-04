/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';

import { EuiConfirmModal, EuiText } from '@elastic/eui';

import { useDeleteSession } from '../../hooks/use_sessions';
import { useCore } from '../../contexts/core_context';

interface DeleteConversationConfirmModalProps {
  onClose?: (status: 'canceled' | 'errored' | 'deleted') => void;
  sessionId: string;
}

export const DeleteConversationConfirmModal = ({
  onClose,
  sessionId,
}: DeleteConversationConfirmModalProps) => {
  const {
    services: {
      notifications: { toasts },
    },
  } = useCore();
  const { loading, deleteSession, abort } = useDeleteSession();

  const handleCancel = useCallback(() => {
    abort();
    onClose?.('canceled');
  }, [onClose, abort]);
  const handleConfirm = useCallback(async () => {
    try {
      await deleteSession(sessionId);
      toasts.addSuccess('The conversation was successfully deleted.');
    } catch (_e) {
      onClose?.('errored');
      return;
    }
    onClose?.('deleted');
  }, [onClose, deleteSession, sessionId, toasts.addSuccess]);

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
