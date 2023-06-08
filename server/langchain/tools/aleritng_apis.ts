/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { ILegacyScopedClusterClient } from '../../../../../src/core/server';

export class OSAlertingTools {
  client: ILegacyScopedClusterClient;
  toolsList = [
    new DynamicTool({
      name: 'Search Alerting Monitors By Index',
      description:
        'use this tool to search alerting mointors by index name in the OpenSearch cluster. This tool takes the index name as input',
      func: (indexName: string) => this.searchAlertMonitorsByIndex(indexName),
    }),
    new DynamicTool({
      name: 'Get All Alerts',
      description: 'use this tool to search all alerts triggered in the OpenSearch cluster.',
      func: () => this.getAllAlerts(),
    }),
  ];

  constructor(client: ILegacyScopedClusterClient) {
    this.client = client;
  }

  // TODO: This is temporarily a pass through call which needs to be deprecated
  public searchAlertMonitorsByIndex = async (indexName: string) => {
    try {
      const query = {
        query: {
          nested: {
            path: 'monitor.inputs',
            query: {
              bool: {
                must: [
                  {
                    match: {
                      'monitor.inputs.search.indices': indexName,
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const params = { body: query };
      const results = await this.client.callAsCurrentUser('alerting.getMonitors', params);
      return JSON.stringify(results.hits.hits);
    } catch (err) {
      return 'Issue in Alerting - MonitorService - searchMonitor:' + err;
    }
  };

  public getAllAlerts = async () => {
    try {
      const results = await this.client.callAsCurrentUser('alerting.getAlerts');
      return JSON.stringify(results);
    } catch (err) {
      return 'Issue in Alerting - Alerts - getAlerts:' + err;
    }
  };
}
