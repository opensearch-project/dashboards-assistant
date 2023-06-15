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
  query: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const PPLVisualizationModal: React.FC<PPLVisualizationModelProps> = (props) => {
  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>PPL Visualization</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiCodeBlock isCopyable>{props.query}</EuiCodeBlock>
        <PPLVisualization query={props.query} />
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
