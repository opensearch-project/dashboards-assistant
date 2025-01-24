/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';

import { EuiConfirmModal, EuiCompressedFieldText, EuiSpacer, EuiText } from '@elastic/eui';
import { useCore } from '../contexts/core_context';
import { usePatchConversation } from '../hooks';

export interface EditConversationNameModalProps {
  onClose?: (status: 'updated' | 'cancelled' | 'errored', newTitle?: string) => void;
  conversationId: string;
  defaultTitle: string;
}

export const EditConversationNameModal = ({
  onClose,
  conversationId,
  defaultTitle,
}: EditConversationNameModalProps) => {
  const {
    services: {
      notifications: { toasts },
    },
  } = useCore();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { loading, abort, patchConversation, isAborted } = usePatchConversation();

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
      toasts.addSuccess('This conversation was successfully updated.');
    } catch (_e) {
      if (isAborted()) {
        return;
      }
      onClose?.('errored');
      toasts.addDanger('There was an error. The name failed to update.');
      return;
    }
    onClose?.('updated', title);
  }, [onClose, conversationId, patchConversation, toasts.addSuccess, toasts.addDanger, isAborted]);

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
      <EuiCompressedFieldText
        inputRef={titleInputRef}
        defaultValue={defaultTitle}
        aria-label="Conversation name input"
      />
    </EuiConfirmModal>
  );
};
