/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';
import { AppMountParameters } from '../../../src/core/public';
import { InputPanel } from './components/text_to_dashboard/input_panel';
import { OpenSearchDashboardsContextProvider } from '../../../src/plugins/opensearch_dashboards_react/public';
import { StartServices } from './types';
import { renderAppNotFound } from './renderAppNotFound';

export const TEXT2DASH_APP_ID = 'text2dash';

export const renderText2DashApp = (params: AppMountParameters, services: StartServices) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Router history={params.history}>
        <Switch>
          <Route path={['/']} component={InputPanel} />
        </Switch>
      </Router>
    </OpenSearchDashboardsContextProvider>,
    params.element
  );
  return () => {
    ReactDOM.unmountComponentAtNode(params.element);
  };
};

export { renderAppNotFound };
