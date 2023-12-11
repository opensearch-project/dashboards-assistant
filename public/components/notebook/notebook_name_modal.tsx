/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiLink,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiFieldText,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import React, { useState, useCallback } from 'react';
import { useCore } from '../../contexts/core_context';
import { toMountPoint } from '../../../../../src/plugins/opensearch_dashboards_react/public';

export interface NotebookNameModalProps {
  onClose: () => void;
  // SaveChat hook depends on context. Runtime modal component can't get context, so saveChat needs to be passed in.
  saveChat: (name: string) => void;
}

export const NotebookNameModal = ({ onClose, saveChat }: NotebookNameModalProps) => {
  const {
    services: {
      notifications: { toasts },
    },
  } = useCore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const notebookId = await saveChat(name);
      const notebookLink = `./observability-notebooks#/${notebookId}?view=view_both`;

      toasts.addSuccess({
        text: toMountPoint(
          <>
            <p>
              This conversation was saved as{' '}
              <EuiLink href={notebookLink} target="_blank">
                {name}
              </EuiLink>
              .
            </p>
          </>
        ),
      });
    } catch (error) {
      if (error.message === 'Not Found') {
        toasts.addDanger(
          'This feature depends on the observability plugin, please install it before use.'
        );
      } else {
        toasts.addDanger('Failed to save to notebook');
      }
    }
    onClose();
  }, [name, saveChat, onclose, toasts.addSuccess, toasts.addDanger]);

  return (
    <>
      <EuiModal onClose={onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Save to notebook</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow label="Please enter a name for your notebook.">
            <EuiFieldText
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Notebook name input"
            />
          </EuiFormRow>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose} data-test-subj="confirmNotebookCancelButton">
            Cancel
          </EuiButtonEmpty>
          <EuiButton
            type="submit"
            fill
            isLoading={loading}
            disabled={name.length < 1}
            onClick={onSubmit}
            data-test-subj="confirmNotebookConfirmButton"
          >
            Confirm name
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </>
  );
};
