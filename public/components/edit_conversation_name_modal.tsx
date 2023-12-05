/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';

import { EuiConfirmModal, EuiFieldText, EuiSpacer, EuiText } from '@elastic/eui';
import { usePatchSession } from '../hooks/use_sessions';
import { useCore } from '../contexts/core_context';

interface EditConversationNameModalProps {
  onClose?: (status: 'updated' | 'cancelled' | 'errored', newTitle?: string) => void;
  sessionId: string;
  defaultTitle: string;
}

export const EditConversationNameModal = ({
  onClose,
  sessionId,
  defaultTitle,
}: EditConversationNameModalProps) => {
  const {
    services: {
      notifications: { toasts },
    },
  } = useCore();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { loading, abort, patchSession, isAborted } = usePatchSession();

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
      await patchSession(sessionId, title);
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
  }, [onClose, sessionId, patchSession, toasts.addSuccess, toasts.addDanger, isAborted]);

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
