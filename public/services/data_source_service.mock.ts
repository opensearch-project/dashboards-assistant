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
    const result = this._isMDSEnabled
      ? {
          dataSourceId: '',
        }
      : {};
    return new Promise((resolve) => {
      resolve(result);
    });
  }

  isMDSEnabled() {
    return this._isMDSEnabled;
  }
}
