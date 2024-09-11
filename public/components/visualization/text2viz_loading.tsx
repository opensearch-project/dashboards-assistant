/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiLoadingLogo } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface Props {
  type: 'loading' | 'generating';
}

const MESSAGES = {
  loading: i18n.translate('dashboardAssistant.feature.text2viz.loading', {
    defaultMessage: 'Loading Visualization',
  }),
  generating: i18n.translate('dashboardAssistant.feature.text2viz.generating', {
    defaultMessage: 'Generating Visualization',
  }),
};

export const Text2VizLoading = ({ type }: Props) => {
  return (
    <EuiEmptyPrompt
      style={{ marginTop: 40 }}
      icon={<EuiLoadingLogo logo="visPie" size="xl" />}
      title={<h2>{MESSAGES[type]}</h2>}
    />
  );
};
