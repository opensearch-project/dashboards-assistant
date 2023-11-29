/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';

import { EuiConfirmModal, EuiText } from '@elastic/eui';

import { useDeleteSession } from '../../hooks/use_sessions';

interface DeleteConversationConfirmModalProps {
  onClose?: (status: 'canceled' | 'errored' | 'deleted') => void;
  sessionId: string;
}

export const DeleteConversationConfirmModal = ({
  onClose,
  sessionId,
}: DeleteConversationConfirmModalProps) => {
  const { loading, deleteSession, abortController } = useDeleteSession();

  const handleCancel = useCallback(() => {
    abortController?.abort();
    onClose?.('canceled');
  }, [onClose, abortController]);
  const handleConfirm = useCallback(async () => {
    try {
      await deleteSession(sessionId);
    } catch (_e) {
      onClose?.('errored');
      return;
    }
    onClose?.('deleted');
  }, [onClose, deleteSession]);

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
