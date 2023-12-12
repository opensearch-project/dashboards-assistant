/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiFieldText,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import React, { useState, useCallback } from 'react';

interface Props {
  onClose: () => void;
  // SaveChat hook depends on context. Runtime modal component can't get context, so saveChat needs to be passed in.
  saveChat: (name: string) => void;
}

export const NotebookNameModal = ({ onClose, saveChat }: Props) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    await saveChat(name);
    onClose();
  }, [name, saveChat, onclose]);

  return (
    <>
      <EuiModal onClose={onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Save to notebook</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow label="Please enter a name for your notebook.">
            <EuiFieldText value={name} onChange={(e) => setName(e.target.value)} />
          </EuiFormRow>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
          <EuiButton
            type="submit"
            fill
            isLoading={loading}
            disabled={name.length < 1}
            onClick={onSubmit}
          >
            Confirm name
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </>
  );
};
