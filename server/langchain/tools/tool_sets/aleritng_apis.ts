/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { PluginToolsFactory } from '../tools_factory/tools_factory';

export class OSAlertingTools extends PluginToolsFactory {
  toolsList = [
    new DynamicTool({
      name: 'Search Alerting Monitors By Index',
      description:
        'use this tool to search alerting monitors by index name in the OpenSearch cluster. This tool takes the index name as input',
      func: (indexName: string) => this.searchAlertMonitorsByIndex(indexName),
      callbacks: this.callbacks,
    }),
    new DynamicTool({
      name: 'Get All Alerts',
      description: 'use this tool to search all alerts triggered in the OpenSearch cluster.',
      func: () => this.getAllAlerts(),
      callbacks: this.callbacks,
    }),
  ];

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
      const results = await this.observabilityClient.callAsCurrentUser(
        'alerting.getMonitors',
        params
      );
      return JSON.stringify(results.hits.hits);
    } catch (err) {
      return 'Issue in Alerting - MonitorService - searchMonitor:' + err;
    }
  };

  public getAllAlerts = async () => {
    try {
      const results = await this.observabilityClient.callAsCurrentUser('alerting.getAlerts');
      return JSON.stringify(results);
    } catch (err) {
      return 'Issue in Alerting - Alerts - getAlerts:' + err;
    }
  };
}
