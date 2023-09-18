/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { CoreStart, HttpStart, SavedObjectsClientContract } from '../../../../src/core/public';
import { DashboardStart } from '../../../../src/plugins/dashboard/public';

interface ICoreServicesContext {
  core: CoreStart;
  http: HttpStart;
  savedObjectsClient: SavedObjectsClientContract;
  DashboardContainerByValueRenderer: DashboardStart['DashboardContainerByValueRenderer'];
}
export const CoreServicesContext = React.createContext<ICoreServicesContext | null>(null);

export const useCoreServicesContext = () => {
  const context = useContext(CoreServicesContext);
  if (!context) throw new Error('CoreServicesContext is not set');
  return context;
};
