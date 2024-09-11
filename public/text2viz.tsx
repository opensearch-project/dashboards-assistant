/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';

import { EuiEmptyPrompt, EuiPage, EuiPageBody, EuiPageContent, EuiText } from '@elastic/eui';
import { AppMountParameters } from '../../../src/core/public';
import { Text2Viz } from './components/visualization/text2viz';
import { OpenSearchDashboardsContextProvider } from '../../../src/plugins/opensearch_dashboards_react/public';
import { StartServices } from './types';

export const TEXT2VIZ_APP_ID = 'text2viz';

export const renderText2VizApp = (params: AppMountParameters, services: StartServices) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Router history={params.history}>
        <Switch>
          <Route path={['/edit/:savedObjectId', '/']} component={Text2Viz} />
        </Switch>
      </Router>
    </OpenSearchDashboardsContextProvider>,

    params.element
  );
  return () => {
    ReactDOM.unmountComponentAtNode(params.element);
  };
};

export const renderAppNotActivated = (params: AppMountParameters) => {
  ReactDOM.render(
    <EuiPage style={{ minHeight: '100%' }} data-test-subj="appNotFoundPageContent">
      <EuiPageBody component="main">
        <EuiPageContent verticalPosition="center" horizontalPosition="center">
          <EuiEmptyPrompt
            iconType="alert"
            iconColor="danger"
            title={<h2>Application Not Activated</h2>}
            body={
              <EuiText size="s">
                <p>
                  No application was found at this URL. Please check your subscription to enable
                  this feature.
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
