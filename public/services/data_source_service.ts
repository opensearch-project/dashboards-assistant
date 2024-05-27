/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, PartialObserver, Subscription } from 'rxjs';
import type { IUiSettingsClient } from '../../../../src/core/public';
import type { DataSourceOption } from '../../../../src/plugins/data_source_management/public/components/data_source_menu/types';
import type { DataSourceManagementPluginSetup } from '../types';

export enum DataSourceIdFrom {
  UiSettings,
  DataSourceSelection,
  Customized,
}

const getDSMDataSourceSelectionOption = (dataSourceSelection: Map<string, DataSourceOption[]>) => {
  const values = [...dataSourceSelection.values()];
  // Should use default index if multi data source selected
  if (values.length === 0 || values.length > 1 || values?.[0]?.length > 1) {
    return null;
  }
  return values[0][0];
};

export class DataSourceService {
  private dataSourceId$ = new BehaviorSubject<string | null>(null);
  private uiSettings: IUiSettingsClient | undefined;
  private dataSourceManagement: DataSourceManagementPluginSetup | undefined;
  private dataSourceSelectionSubscription: Subscription | undefined;
  private dataSourceIdFrom: DataSourceIdFrom | undefined;

  constructor() {}

  initDefaultDataSourceIdIfNeed() {
    if (!this.isMDSEnabled() || this.dataSourceId$.getValue() !== null) {
      return;
    }
    const defaultDataSourceId = this.uiSettings?.get('defaultDataSource', null);
    if (!defaultDataSourceId) {
      return;
    }
    this.setDataSourceId(defaultDataSourceId, DataSourceIdFrom.UiSettings);
  }

  clearDataSourceId() {
    this.setDataSourceId(null, undefined);
  }

  getDataSourceQuery() {
    if (!this.isMDSEnabled()) {
      return {};
    }
    const dataSourceId = this.dataSourceId$.getValue();
    if (dataSourceId === null) {
      throw new Error('No data source id');
    }
    if (dataSourceId === '') {
      return {};
    }
    return { dataSourceId };
  }

  isMDSEnabled() {
    return !!this.dataSourceManagement;
  }

  setDataSourceId(newDataSourceId: string | null, dataSourceIdFrom: DataSourceIdFrom | undefined) {
    this.dataSourceIdFrom = dataSourceIdFrom;
    if (this.dataSourceId$.getValue() === newDataSourceId) {
      return;
    }
    this.dataSourceId$.next(newDataSourceId);
  }

  getDataSourceId() {
    return this.dataSourceId$.getValue();
  }

  subscribeDataSourceId(observer?: PartialObserver<string | null>) {
    return this.dataSourceId$.subscribe(observer);
  }

  setup({
    uiSettings,
    dataSourceManagement,
  }: {
    uiSettings: IUiSettingsClient;
    dataSourceManagement?: DataSourceManagementPluginSetup;
  }) {
    this.uiSettings = uiSettings;
    this.dataSourceManagement = dataSourceManagement;

    this.dataSourceSelectionSubscription = this.dataSourceManagement?.dataSourceSelection
      ?.getSelection$()
      .subscribe((dataSourceSelection) => {
        const selectedDataSourceOption = getDSMDataSourceSelectionOption(dataSourceSelection);
        this.setDataSourceId(
          selectedDataSourceOption?.id ?? null,
          DataSourceIdFrom.DataSourceSelection
        );
      });

    this.uiSettings.get$('defaultDataSource', null).subscribe((newDataSourceId) => {
      if (this.dataSourceIdFrom === DataSourceIdFrom.UiSettings) {
        this.setDataSourceId(newDataSourceId, DataSourceIdFrom.UiSettings);
      }
    });
    return {
      setDataSourceId: (newDataSourceId: string | null) => {
        this.setDataSourceId(newDataSourceId, DataSourceIdFrom.Customized);
      },
    };
  }

  start() {
    return {
      setDataSourceId: (newDataSourceId: string | null) => {
        this.setDataSourceId(newDataSourceId, DataSourceIdFrom.Customized);
      },
    };
  }

  public stop() {
    this.dataSourceSelectionSubscription?.unsubscribe();
    this.dataSourceId$.complete();
  }
}
