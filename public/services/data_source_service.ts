/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import type { IUiSettingsClient } from '../../../../src/core/public';
import type { DataSourceOption } from '../../../../src/plugins/data_source_management/public/components/data_source_menu/types';
import { DataSourceManagementPluginSetup } from '../../../../src/plugins/data_source_management/public';

export enum DataSourceIdFrom {
  UiSettings,
  DataSourceSelection,
  Customized,
}

export interface DataSourceServiceContract {
  setDataSourceId: (newDataSourceId: string | null) => void;
}

const getSingleSelectedDataSourceOption = (
  dataSourceSelection: Map<string, DataSourceOption[]>
) => {
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
  private finalDataSourceId: string | null = null;
  dataSourceIdUpdates$ = new Subject<string | null>();
  private getDataSourceIdSubscription: Subscription | undefined;

  constructor() {}

  private init() {
    if (!this.isMDSEnabled()) {
      return;
    }
    if (!this.dataSourceManagement?.dataSourceSelection) {
      return;
    }
    this.dataSourceSelectionSubscription = this.dataSourceManagement.dataSourceSelection
      .getSelection$()
      .pipe(map(getSingleSelectedDataSourceOption))
      .subscribe((v) => {
        this.setDataSourceId(v?.id ?? null);
      });
  }

  getDataSourceQuery() {
    if (!this.isMDSEnabled()) {
      return {};
    }
    const dataSourceId = this.finalDataSourceId;
    if (dataSourceId === null) {
      throw new Error('No data source id');
    }
    // empty means using local cluster
    if (dataSourceId === '') {
      return {};
    }
    return { dataSourceId };
  }

  isMDSEnabled() {
    return !!this.dataSourceManagement;
  }

  setDataSourceId(newDataSourceId: string | null) {
    this.dataSourceId$.next(newDataSourceId);
  }

  getDataSourceId$() {
    return combineLatest([
      this.dataSourceId$,
      (this.dataSourceManagement?.getDefaultDataSourceId$?.(this.uiSettings) ??
        of(null)) as Observable<string | null>,
    ])
      .pipe(
        map(([selectedDataSourceId, defaultDataSourceId]) => {
          if (selectedDataSourceId !== null) {
            return selectedDataSourceId;
          }
          return defaultDataSourceId;
        })
      )
      .pipe(distinctUntilChanged());
  }

  setup({
    uiSettings,
    dataSourceManagement,
  }: {
    uiSettings: IUiSettingsClient;
    dataSourceManagement?: DataSourceManagementPluginSetup;
  }): DataSourceServiceContract {
    this.uiSettings = uiSettings;
    this.dataSourceManagement = dataSourceManagement;
    this.init();
    this.getDataSourceIdSubscription = this.getDataSourceId$().subscribe((finalDataSourceId) => {
      this.finalDataSourceId = finalDataSourceId;
      this.dataSourceIdUpdates$.next(finalDataSourceId);
    });

    return {
      setDataSourceId: (newDataSourceId: string | null) => {
        this.setDataSourceId(newDataSourceId);
      },
    };
  }

  start(): DataSourceServiceContract {
    return {
      setDataSourceId: (newDataSourceId: string | null) => {
        this.setDataSourceId(newDataSourceId);
      },
    };
  }

  public stop() {
    this.dataSourceSelectionSubscription?.unsubscribe();
    this.getDataSourceIdSubscription?.unsubscribe();
    this.dataSourceIdUpdates$.complete();
    this.dataSourceId$.complete();
  }
}
