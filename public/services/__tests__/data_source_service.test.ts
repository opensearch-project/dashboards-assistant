/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Subject } from 'rxjs';
import { uiSettingsServiceMock } from '../../../../../src/core/public/mocks';
import { DataSourceOption } from '../../../../../src/plugins/data_source_management/public/components/data_source_menu/types';
import { DataSourceManagementPluginSetup } from '../../types';
import { DataSourceService } from '../data_source_service';

const setup = (options?: { dataSourceManagement?: DataSourceManagementPluginSetup }) => {
  const dataSourceSelection$ = new BehaviorSubject<Map<string, DataSourceOption[]>>(new Map());
  const uiSettings = uiSettingsServiceMock.createSetupContract();
  const dataSourceManagement: DataSourceManagementPluginSetup = {
    dataSourceSelection: {
      getSelection$: () => dataSourceSelection$,
    },
  };
  const dataSource = new DataSourceService();
  const defaultDataSourceSelection$ = new Subject();
  uiSettings.get$.mockReturnValueOnce(defaultDataSourceSelection$);
  const setupResult = dataSource.setup({
    uiSettings,
    dataSourceManagement:
      options && 'dataSourceManagement' in options
        ? options.dataSourceManagement
        : dataSourceManagement,
  });

  return {
    dataSource,
    uiSettings,
    dataSourceSelection$,
    defaultDataSourceSelection$,
    setupResult,
  };
};

describe('DataSourceService', () => {
  it('should return data source selection provided data source id', () => {
    const { dataSource, dataSourceSelection$ } = setup();

    expect(dataSource.getDataSourceId()).toBe(null);

    dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));

    expect(dataSource.getDataSourceId()).toBe('foo');
  });
  describe('initDefaultDataSourceIdIfNeed', () => {
    it('should return ui settings provided data source id', () => {
      const { dataSource, uiSettings } = setup();

      uiSettings.get.mockReturnValueOnce('foo');

      expect(dataSource.getDataSourceId()).toBe(null);

      dataSource.initDefaultDataSourceIdIfNeed();

      expect(dataSource.getDataSourceId()).toBe('foo');
    });
    it('should return data source selection provided data source', () => {
      const { dataSource, dataSourceSelection$, uiSettings } = setup();

      uiSettings.get.mockReturnValueOnce('bar');

      expect(dataSource.getDataSourceId()).toBe(null);

      dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));

      expect(dataSource.getDataSourceId()).toBe('foo');

      dataSource.initDefaultDataSourceIdIfNeed();
      expect(dataSource.getDataSourceId()).toBe('foo');
    });
  });
  it('should update data source id after default data source id changed', () => {
    const { dataSource, defaultDataSourceSelection$, uiSettings } = setup();

    uiSettings.get.mockReturnValueOnce('foo');
    dataSource.initDefaultDataSourceIdIfNeed();
    expect(dataSource.getDataSourceId()).toBe('foo');
    defaultDataSourceSelection$.next('bar');
    expect(dataSource.getDataSourceId()).toBe('bar');
  });
  it('should not update data source id when data source id not from ui settings', () => {
    const { dataSource, dataSourceSelection$, defaultDataSourceSelection$ } = setup();

    expect(dataSource.getDataSourceId()).toBe(null);

    dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));
    defaultDataSourceSelection$.next('bar');
    expect(dataSource.getDataSourceId()).toBe('foo');
  });
  it('should return null for multi data source selection', () => {
    const { dataSource, dataSourceSelection$ } = setup();

    expect(dataSource.getDataSourceId()).toBe(null);

    dataSourceSelection$.next(
      new Map([
        [
          'test',
          [
            { label: 'Foo', id: 'foo' },
            { label: 'Bar', id: 'bar' },
          ],
        ],
      ])
    );
    expect(dataSource.getDataSourceId()).toBe(null);

    dataSourceSelection$.next(
      new Map([
        ['component1', [{ label: 'Foo', id: 'foo' }]],
        ['component2', [{ label: 'Bar', id: 'bar' }]],
      ])
    );
    expect(dataSource.getDataSourceId()).toBe(null);
  });
  it('should return null for empty data source selection', () => {
    const { dataSource, dataSourceSelection$ } = setup();

    expect(dataSource.getDataSourceId()).toBe(null);

    dataSourceSelection$.next(new Map());
    expect(dataSource.getDataSourceId()).toBe(null);
  });
  it('should able to subscribe data source id changes', () => {
    const { dataSource } = setup();
    const mockFn = jest.fn();
    dataSource.subscribeDataSourceId({ next: mockFn });

    dataSource.setDataSourceId('foo', undefined);
    expect(mockFn).toHaveBeenCalledWith('foo');
    expect(mockFn).toHaveBeenCalledTimes(2);

    dataSource.setDataSourceId('foo', undefined);
    expect(mockFn).toHaveBeenCalledTimes(2);

    dataSource.setDataSourceId('bar', undefined);
    expect(mockFn).toHaveBeenCalledWith('bar');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
  describe('isMDSEnabled', () => {
    it('should return true if multi data source provided', () => {
      const { dataSource } = setup();
      expect(dataSource.isMDSEnabled()).toBe(true);
    });
    it('should return false if multi data source not provided', () => {
      const { dataSource } = setup({ dataSourceManagement: undefined });
      expect(dataSource.isMDSEnabled()).toBe(false);
    });
  });

  describe('getDataSourceQuery', () => {
    it('should return empty object if MDS not enabled', () => {
      const { dataSource } = setup({ dataSourceManagement: undefined });
      expect(dataSource.getDataSourceQuery()).toEqual({});
    });
    it('should return empty object if data source id is empty', () => {
      const { dataSource, dataSourceSelection$ } = setup();
      dataSourceSelection$.next(new Map([['test', [{ label: '', id: '' }]]]));
      expect(dataSource.getDataSourceQuery()).toEqual({});
    });
    it('should return query object with provided data source id', () => {
      const { dataSource, dataSourceSelection$ } = setup();
      dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));
      expect(dataSource.getDataSourceQuery()).toEqual({ dataSourceId: 'foo' });
    });
    it('should throw error if data source id not exists', () => {
      const { dataSource } = setup();
      let error;
      try {
        dataSource.getDataSourceQuery();
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
    });
  });
  it('should clear data source id', () => {
    const { dataSource, dataSourceSelection$ } = setup();
    dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));
    expect(dataSource.getDataSourceId()).toEqual('foo');
    dataSource.clearDataSourceId();
    expect(dataSource.getDataSourceId()).toEqual(null);
  });
  it('should able to change data source id from outside', () => {
    const { dataSource, setupResult } = setup();
    setupResult.setDataSourceId('foo');
    expect(dataSource.getDataSourceId()).toBe('foo');
    dataSource.start().setDataSourceId('bar');
    expect(dataSource.getDataSourceId()).toBe('bar');
  });
  describe('stop', () => {
    it('should unsubscribe data source selection', () => {
      const { dataSource, dataSourceSelection$ } = setup();
      dataSource.stop();
      dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));
      expect(dataSource.getDataSourceId()).toBe(null);
    });
    it('should complete data source id', () => {
      const { dataSource } = setup();
      const mockFn = jest.fn();
      dataSource.subscribeDataSourceId({
        complete: mockFn,
      });
      dataSource.stop();
      expect(mockFn).toHaveBeenCalled();
    });
  });
});
