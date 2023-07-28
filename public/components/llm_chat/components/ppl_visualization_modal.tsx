/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import React from 'react';
import { PPLVisualization } from './ppl_visualization';

interface PPLVisualizationModelProps {
  title: React.ReactNode;
  query: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const PPLVisualizationModal: React.FC<PPLVisualizationModelProps> = (props) => {
  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle style={{ fontSize: '1.25rem' }}>{props.title}</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <div>
          <EuiCodeBlock isCopyable>{props.query}</EuiCodeBlock>
          <PPLVisualization query={props.query} />
        </div>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={props.onConfirm} fill>
          Save
        </EuiButton>
        <EuiButtonEmpty onClick={props.onClose}>Close</EuiButtonEmpty>
      </EuiModalFooter>
    </>
  );
};
