/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export const Text2VizEmpty = () => {
  return (
    <EuiEmptyPrompt
      style={{ marginTop: 40 }}
      iconType="editorCodeBlock"
      title={
        <h2>
          {i18n.translate('dashboardAssistant.feature.text2viz.getStarted', {
            defaultMessage: 'Get started',
          })}
        </h2>
      }
      body={
        <>
          <p>
            {i18n.translate('dashboardAssistant.feature.text2viz.body', {
              defaultMessage:
                'Use the Natural Language Query form field to automatically generate visualizations using simple conversational prompts.',
            })}
          </p>
        </>
      }
    />
  );
};
