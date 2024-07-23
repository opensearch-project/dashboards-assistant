/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseAdditionalActions } from './ParserHelper';

describe('ParseHelper', () => {
  it('return additional actions when there is CreateAlertTool.output', async () => {
    const output: string =
      '\n' +
      '{\n' +
      '    "name": "Flight Delay Alert",\n' +
      '    "search": {\n' +
      '        "indices": ["opensearch_dashboards_sample_data_flights"],\n' +
      '        "timeField": "timestamp",\n' +
      '        "bucketValue": 12,\n' +
      '        "bucketUnitOfTime": "h",\n' +
      '        "filters": [\n' +
      '            {\n' +
      '                "fieldName": [\n' +
      '                    {\n' +
      '                        "label": "FlightDelayMin",\n' +
      '                        "type": "integer"\n' +
      '                    }\n' +
      '                ],\n' +
      '                "fieldValue": 0,\n' +
      '                "operator": "is_greater"\n' +
      '            }\n' +
      '        ],\n' +
      '        "aggregations": [\n' +
      '            {\n' +
      '                "aggregationType": "sum",\n' +
      '                "fieldName": "FlightDelayMin"\n' +
      '            }\n' +
      '        ]\n' +
      '    },\n' +
      '    "triggers": [\n' +
      '        {\n' +
      '            "name": "Delayed Time Exceeds 1000 Minutes",\n' +
      '            "severity": 2,\n' +
      '            "thresholdValue": 1000,\n' +
      '            "thresholdEnum": "ABOVE"\n' +
      '        }\n' +
      '    ]\n' +
      '}\n';
    const expectedContent: string =
      'name=Flight%20Delay%20Alert&index=opensearch_dashboards_sample_data_flights&timeField=timestamp&bucketValue=12&bucketUnitOfTime=h&filters=%5B%7B%22fieldName%22%3A%5B%7B%22label%22%3A%22FlightDelayMin%22%2C%22type%22%3A%22integer%22%7D%5D%2C%22fieldValue%22%3A0%2C%22operator%22%3A%22is_greater%22%7D%5D&aggregations=%5B%7B%22aggregationType%22%3A%22sum%22%2C%22fieldName%22%3A%22FlightDelayMin%22%7D%5D&triggers=%5B%7B%22name%22%3A%22Delayed%20Time%20Exceeds%201000%20Minutes%22%2C%22severity%22%3A2%2C%22thresholdValue%22%3A1000%2C%22thresholdEnum%22%3A%22ABOVE%22%7D%5D';
    expect(
      parseAdditionalActions({
        input: 'input',
        response: 'response',
        conversation_id: '',
        interaction_id: 'interaction_id',
        create_time: '',
        additional_info: {
          'CreateAlertTool.output': [output],
        },
      })
    ).toEqual([
      {
        actionType: 'create_alert_button',
        message: 'Create Alert',
        content: expectedContent,
      },
    ]);
  });

  it('do not return additional actions when CreateAlertTool.output is null', async () => {
    expect(
      parseAdditionalActions({
        input: 'input',
        response: 'response',
        conversation_id: '',
        interaction_id: 'interaction_id',
        create_time: '',
        additional_info: {},
      })
    ).toEqual([]);
  });

  // Normally It won't happen since backend will never put a non-json output inCreateAlertTool.output. But we still want to handle it and add `create alert` button as additional action as it has invoked create alert tool.
  it('return additional actions with empty content when CreateAlertTool.output is wrong format', async () => {
    expect(
      parseAdditionalActions({
        input: 'input',
        response: 'response',
        conversation_id: '',
        interaction_id: 'interaction_id',
        create_time: '',
        additional_info: {
          'CreateAlertTool.output': ['None json output'],
        },
      })
    ).toEqual([
      {
        actionType: 'create_alert_button',
        message: 'Create Alert',
        content: '',
      },
    ]);
  });

  it('return additional actions with existing info when CreateAlertTool.output missing part of parameters', async () => {
    expect(
      parseAdditionalActions({
        input: 'input',
        response: 'response',
        conversation_id: '',
        interaction_id: 'interaction_id',
        create_time: '',
        additional_info: {
          'CreateAlertTool.output': ['{"name": "Test name"}'],
        },
      })
    ).toEqual([
      {
        actionType: 'create_alert_button',
        message: 'Create Alert',
        content: 'name=Test%20name&triggers=',
      },
    ]);
  });
});
