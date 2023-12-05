/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';

import { EuiConfirmModal, EuiFieldText, EuiSpacer, EuiText } from '@elastic/eui';
import { usePatchConversation } from '../hooks/use_conversations';

interface EditConversationNameModalProps {
  onClose?: (status: 'updated' | 'cancelled' | 'errored', newTitle?: string) => void;
  conversationId: string;
  defaultTitle: string;
}

export const EditConversationNameModal = ({
  onClose,
  conversationId,
  defaultTitle,
}: EditConversationNameModalProps) => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { loading, abort, patchConversation } = usePatchConversation();

  const handleCancel = useCallback(() => {
    abort();
    onClose?.('cancelled');
  }, [onClose, abort]);
  const handleConfirm = useCallback(async () => {
    const title = titleInputRef.current?.value.trim();
    if (!title) {
      return;
    }
    try {
      await patchConversation(conversationId, title);
    } catch (_e) {
      onClose?.('errored');
      return;
    }
    onClose?.('updated', title);
  }, [onClose, conversationId, patchConversation]);

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
