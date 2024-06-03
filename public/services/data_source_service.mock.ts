/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class DataSourceServiceMock {
  constructor() {}

  getDataSourceQuery() {
    return new Promise((resolve) => {
      resolve({ dataSourceId: '' });
    });
    // return { dataSourceId: '' };
  }
}
