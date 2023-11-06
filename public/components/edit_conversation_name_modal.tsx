/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';

import { EuiConfirmModal, EuiFieldText, EuiSpacer, EuiText } from '@elastic/eui';
import { usePatchSession } from '../hooks/use_sessions';

interface EditConversationNameModalProps {
  onClose?: (status: 'updated' | 'cancelled' | 'errored') => void;
  sessionId: string;
  defaultTitle: string;
}

export const EditConversationNameModal = ({
  onClose,
  sessionId,
  defaultTitle,
}: EditConversationNameModalProps) => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { loading, abortController, patchSession } = usePatchSession();

  const handleCancel = useCallback(() => {
    abortController?.abort();
    onClose?.('cancelled');
  }, [onClose, abortController]);
  const handleConfirm = useCallback(async () => {
    const title = titleInputRef.current?.value.trim();
    if (!title) {
      return;
    }
    try {
      await patchSession(sessionId, title);
    } catch (_e) {
      onClose?.('errored');
      return;
    }
    onClose?.('updated');
  }, [onClose, sessionId, patchSession]);

  return (
    <EuiConfirmModal
      title="Edit conversation name"
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      cancelButtonText="Cancel"
      confirmButtonText="Confirm name"
      confirmButtonDisabled={loading}
      isLoading={loading}
    >
      <EuiText size="s">
        <p>Please enter a new name for your conversation.</p>
      </EuiText>
      <EuiSpacer size="xs" />
      <EuiFieldText inputRef={titleInputRef} defaultValue={defaultTitle} />
    </EuiConfirmModal>
  );
};
