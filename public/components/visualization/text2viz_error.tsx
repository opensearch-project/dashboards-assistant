/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface Props {
  message?: string;
}

export const Text2VizError = (props: Props) => {
  return (
    <EuiEmptyPrompt
      style={{ marginTop: 40 }}
      iconType="editorCodeBlock"
      title={
        <h2>
          {i18n.translate('dashboardAssistant.feature.text2viz.errorTitle', {
            defaultMessage: 'Error happened',
          })}
        </h2>
      }
      body={
        <>
          <p>
            {props.message ||
              i18n.translate('dashboardAssistant.feature.text2viz.errorBody', {
                defaultMessage: 'Error while executing text to visualization.',
              })}
          </p>
        </>
      }
    />
  );
};
