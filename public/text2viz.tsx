/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';

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
