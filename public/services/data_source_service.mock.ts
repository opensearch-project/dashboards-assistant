/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class DataSourceServiceMock {
  private _isMDSEnabled = true;
  constructor(isMDSEnabled?: boolean) {
    this._isMDSEnabled = isMDSEnabled ?? true;
  }

  getDataSourceQuery() {
    return this._isMDSEnabled
      ? {
          dataSourceId: '',
        }
      : {};
  }

  isMDSEnabled() {
    return this._isMDSEnabled;
  }
}
