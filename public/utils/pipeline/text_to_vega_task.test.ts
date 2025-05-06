/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock, savedObjectsServiceMock } from '../../../../../src/core/public/mocks';
import { Text2VegaTask } from './text_to_vega_task';

describe('Text2VegaTask', () => {
  it('should return vega schema which escaped `field`', async () => {
    const httpMock = httpServiceMock.createStartContract();
    const savedObjectsMock = savedObjectsServiceMock.createStartContract();
    httpMock.post.mockResolvedValue({
      $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
      description: 'A bar chart that sorts the y-values by the x-values.',
      mark: 'bar',
      encoding: {
        y: {
          field: 'user.age',
          type: 'ordinal',
        },
        x: {
          aggregate: 'sum',
          field: 'people',
          title: 'population',
        },
      },
    });

    const task = new Text2VegaTask(httpMock, savedObjectsMock);
    const res = await task.text2vega({
      inputQuestion: 'mock question',
      ppl: 'source=mock_source',
      sampleData: '',
      dataSchema: '',
    });
    expect(res.encoding.y.field).toEqual('user\\.age');
  });

  it('should return vega schema which escaped layer `field`', async () => {
    const httpMock = httpServiceMock.createStartContract();
    const savedObjectsMock = savedObjectsServiceMock.createStartContract();
    httpMock.post.mockResolvedValue({
      $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
      description: 'A bar chart that sorts the y-values by the x-values.',
      mark: 'bar',
      layer: [
        {
          encoding: {
            y: {
              field: 'user.age',
              type: 'ordinal',
            },
            x: {
              aggregate: 'sum',
              field: 'people',
              title: 'population',
            },
          },
        },
      ],
    });

    const task = new Text2VegaTask(httpMock, savedObjectsMock);
    const res = await task.text2vega({
      inputQuestion: 'mock question',
      ppl: 'source=mock_source',
      sampleData: '',
      dataSchema: '',
    });
    expect(res.layer[0].encoding.y.field).toEqual('user\\.age');
  });

  it('should have data.url properly set', async () => {
    const httpMock = httpServiceMock.createStartContract();
    const savedObjectsMock = savedObjectsServiceMock.createStartContract();
    const task = new Text2VegaTask(httpMock, savedObjectsMock);
    jest.spyOn(task, 'text2vega').mockResolvedValue({
      $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
      description: 'A bar chart that sorts the y-values by the x-values.',
      mark: 'bar',
      layer: [
        {
          encoding: {
            y: {
              field: 'user\\.age',
              type: 'ordinal',
            },
            x: {
              aggregate: 'sum',
              field: 'people',
              title: 'population',
            },
          },
        },
      ],
    });
    jest.spyOn(task, 'getDataSourceNameById').mockResolvedValue('mocked_data_source_name');
    const result = await task.execute({
      inputQuestion: 'mocked question',
      dataSourceId: 'test',
      ppl: 'source=test',
      inputInstruction: '',
      sample: {},
      timeFieldName: 'timestamp',
    });
    // %fimefield% is set
    // %type% is set to ppl
    // body.query is set to the input ppl query
    // data_source_name is set
    expect(result.vega.data.url).toEqual({
      '%type%': 'ppl',
      '%timefield%': 'timestamp',
      body: { query: 'source=test' },
      data_source_name: 'mocked_data_source_name',
    });
  });
});
