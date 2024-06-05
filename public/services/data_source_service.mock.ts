/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class DataSourceServiceMock {
  private _isMDSEnabled = false;
  constructor(isMDSEnabled?: boolean) {
    this._isMDSEnabled = isMDSEnabled ?? false;
  }

  getDataSourceQuery() {
    const dataSourceId = {
      dataSourceId: this._isMDSEnabled ? 'data_source_id' : '',
    };
    return new Promise((resolve) => {
      resolve(dataSourceId);
    });
  }

  isMDSEnabled() {
    return this._isMDSEnabled;
  }
}
