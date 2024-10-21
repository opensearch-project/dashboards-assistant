/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiTextArea,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface Props {
  onApply: (input: string) => void;
  value?: string;
  iconType: string;
  className?: string;
}

export const VizStyleEditor = ({ onApply, className, iconType, value }: Props) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const onApplyClick = useCallback(() => {
    onApply(inputValue.trim());
    setModalVisible(false);
  }, [inputValue, onApply]);

  const openModal = useCallback(() => {
    if (value) {
      setInputValue(value);
    }
    setModalVisible(true);
  }, [value]);

  return (
    <div className={className}>
      <EuiButton
        className="vizStyleEditor__editButton"
        size="s"
        iconType={iconType}
        onClick={openModal}
      >
        {i18n.translate('dashboardAssistant.feature.text2viz.editVisualButton.label', {
          defaultMessage: 'Edit visual',
        })}
      </EuiButton>
      {modalVisible && (
        <EuiModal data-test-subj="text2vizStyleEditorModal" onClose={() => setModalVisible(false)}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>
                {i18n.translate('dashboardAssistant.feature.text2viz.editVisualModal.title', {
                  defaultMessage: 'Edit visual',
                })}
              </h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            {i18n.translate('dashboardAssistant.feature.text2viz.editVisualModal.body', {
              defaultMessage: 'How would you like to edit the visual?',
            })}
            <EuiSpacer size="s" />
            <EuiTextArea
              compressed
              autoFocus
              aria-label="Input instructions to tweak the visual"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButtonEmpty size="s" onClick={() => setModalVisible(false)}>
              {i18n.translate('dashboardAssistant.feature.text2viz.editVisualModal.cancel', {
                defaultMessage: 'Cancel',
              })}
            </EuiButtonEmpty>
            <EuiButton
              data-test-subj="text2vizStyleEditorModalApply"
              size="s"
              fill
              onClick={onApplyClick}
              disabled={inputValue.trim().length === 0}
            >
              {i18n.translate('dashboardAssistant.feature.text2viz.editVisualModal.apply', {
                defaultMessage: 'Apply',
              })}
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </div>
  );
};
