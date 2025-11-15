/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { EuiEmptyPrompt, EuiPage, EuiPageBody, EuiPageContent, EuiText } from '@elastic/eui';
import { AppMountParameters } from '../../../src/core/public';

export const renderAppNotFound = (params: AppMountParameters) => {
  ReactDOM.render(
    <EuiPage style={{ minHeight: '100%' }} data-test-subj="appNotFoundPageContent">
      <EuiPageBody component="main">
        <EuiPageContent verticalPosition="center" horizontalPosition="center">
          <EuiEmptyPrompt
            iconType="alert"
            iconColor="danger"
            title={<h2>Application Not Found</h2>}
            body={
              <EuiText size="s">
                <p>
                  No application was found at this URL. Please check your app status to enable this
                  feature.
                </p>
              </EuiText>
            }
          />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>,
    params.element
  );
  return () => {
    ReactDOM.unmountComponentAtNode(params.element);
  };
};
