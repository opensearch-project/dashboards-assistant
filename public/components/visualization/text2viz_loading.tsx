/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiLoadingLogo } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export const Text2VizLoading = () => {
  return (
    <EuiEmptyPrompt
      icon={<EuiLoadingLogo logo="visPie" size="xl" />}
      title={
        <h2>
          {i18n.translate('dashboardAssistant.feature.text2viz.loading', {
            defaultMessage: 'Generating Visualization',
          })}
        </h2>
      }
    />
  );
};
