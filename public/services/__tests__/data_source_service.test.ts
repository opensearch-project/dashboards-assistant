/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

import { uiSettingsServiceMock } from '../../../../../src/core/public/mocks';
import { DataSourceOption } from '../../../../../src/plugins/data_source_management/public/components/data_source_menu/types';
import { DataSourceManagementPluginSetup } from '../../types';
import { DataSourceService } from '../data_source_service';

const setup = (options?: {
  dataSourceManagement?: DataSourceManagementPluginSetup;
  defaultDataSourceId?: string | null;
  dataSourceSelection?: Map<string, DataSourceOption[]>;
}) => {
  const dataSourceSelection$ = new BehaviorSubject<Map<string, DataSourceOption[]>>(
    options?.dataSourceSelection ?? new Map()
  );
  const uiSettings = uiSettingsServiceMock.createSetupContract();
  const dataSourceManagement: DataSourceManagementPluginSetup = {
    dataSourceSelection: {
      getSelection$: () => dataSourceSelection$,
    },
  };
  const dataSource = new DataSourceService();
  const defaultDataSourceSelection$ = new BehaviorSubject(options?.defaultDataSourceId ?? null);
  uiSettings.get$.mockReturnValue(defaultDataSourceSelection$);
  const setupResult = dataSource.setup({
    uiSettings,
    dataSourceManagement:
      options && 'dataSourceManagement' in options
        ? options.dataSourceManagement
        : dataSourceManagement,
  });

  return {
    dataSource,
    dataSourceSelection$,
    defaultDataSourceSelection$,
    setupResult,
  };
};

describe('DataSourceService', () => {
  describe('getDataSourceId$', () => {
    it('should return data source selection provided value', async () => {
      const { dataSource } = setup({
        defaultDataSourceId: 'foo',
        dataSourceSelection: new Map([['test', [{ label: 'Bar', id: 'bar' }]]]),
      });

      expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('bar');
    });
    it('should return data source selection provided value even default data source changed', async () => {
      const { dataSource, defaultDataSourceSelection$ } = setup({
        defaultDataSourceId: 'foo',
        dataSourceSelection: new Map([['test', [{ label: 'Bar', id: 'bar' }]]]),
      });

      defaultDataSourceSelection$.next('baz');
      expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('bar');
    });
    it('should return default data source id if no data source selection', async () => {
      const { dataSource } = setup({ defaultDataSourceId: 'foo' });

      expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('foo');
    });
    it('should return default data source id if data source selection become empty', () => {
      const { dataSource, dataSourceSelection$ } = setup({
        defaultDataSourceId: 'foo',
        dataSourceSelection: new Map([['test', [{ label: 'Bar', id: 'bar' }]]]),
      });
      const observerFn = jest.fn();
      dataSource.getDataSourceId$().subscribe(observerFn);
      expect(observerFn).toHaveBeenLastCalledWith('bar');

      dataSourceSelection$.next(new Map());
      expect(observerFn).toHaveBeenLastCalledWith('foo');
    });
    it('should return default data source for multi data source selection', async () => {
      const { dataSource, dataSourceSelection$ } = setup({
        defaultDataSourceId: 'baz',
        dataSourceSelection: new Map([
          [
            'test',
            [
              { label: 'Foo', id: 'foo' },
              { label: 'Bar', id: 'bar' },
            ],
          ],
        ]),
      });

      expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('baz');

      dataSourceSelection$.next(
        new Map([
          ['component1', [{ label: 'Foo', id: 'foo' }]],
          ['component2', [{ label: 'Bar', id: 'bar' }]],
        ])
      );
      expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('baz');
    });
    it('should return default data source for empty data source selection', async () => {
      const { dataSource } = setup({
        defaultDataSourceId: 'foo',
        dataSourceSelection: new Map(),
      });
      expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('foo');
    });
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
    it('should return empty object if MDS not enabled', async () => {
      const { dataSource } = setup({ dataSourceManagement: undefined });
      expect(await dataSource.getDataSourceQuery()).toEqual({});
    });
    it('should return empty object if data source id is empty', async () => {
      const { dataSource } = setup({
        dataSourceSelection: new Map([['test', [{ label: '', id: '' }]]]),
      });
      expect(await dataSource.getDataSourceQuery()).toEqual({});
    });
    it('should return query object with provided data source id', async () => {
      const { dataSource } = setup({ defaultDataSourceId: 'foo' });
      expect(await dataSource.getDataSourceQuery()).toEqual({ dataSourceId: 'foo' });
    });
    it('should throw error if data source id not exists', async () => {
      const { dataSource } = setup();
      let error;
      try {
        await dataSource.getDataSourceQuery();
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
    });
  });
  describe('stop', () => {
    it('should not emit after data source selection unsubscribe', async () => {
      const { dataSource, dataSourceSelection$ } = setup();
      const observerFn = jest.fn();
      dataSource.getDataSourceId$().subscribe(observerFn);
      expect(observerFn).toHaveBeenCalledTimes(1);
      dataSource.stop();
      dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));
      expect(observerFn).toHaveBeenCalledTimes(1);
    });
    it('should not emit after data source id subject complete', () => {
      const { dataSource } = setup();
      const observerFn = jest.fn();
      dataSource.getDataSourceId$().subscribe(observerFn);
      expect(observerFn).toHaveBeenCalledTimes(1);
      dataSource.stop();
      dataSource.setDataSourceId('foo');
      expect(observerFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('setup', () => {
    it('should able to change data source id from setup result', async () => {
      const { dataSource, setupResult } = setup();
      setupResult.setDataSourceId('foo');
      expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('foo');
    });

    it('should update data source id after data source selection changed', () => {
      const { dataSource, dataSourceSelection$ } = setup();
      const observerFn = jest.fn();
      dataSource.getDataSourceId$().subscribe(observerFn);

      dataSourceSelection$.next(new Map([['test', [{ label: 'Foo', id: 'foo' }]]]));
      expect(observerFn).toHaveBeenLastCalledWith('foo');

      dataSourceSelection$.next(new Map([['test', [{ label: 'Bar', id: 'bar' }]]]));
      expect(observerFn).toHaveBeenLastCalledWith('bar');
    });
  });

  it('should able to change data source id from start result', async () => {
    const { dataSource } = setup();
    dataSource.start().setDataSourceId('bar');
    expect(await dataSource.getDataSourceId$().pipe(first()).toPromise()).toBe('bar');
  });

  it('should not fire change when call setDataSourceId with same data source id', async () => {
    const { dataSource } = setup();
    const observerFn = jest.fn();
    dataSource.getDataSourceId$().subscribe(observerFn);
    dataSource.setDataSourceId('foo');
    expect(observerFn).toHaveBeenCalledTimes(2);

    dataSource.setDataSourceId('foo');
    expect(observerFn).toHaveBeenCalledTimes(2);

    dataSource.setDataSourceId('bar');
    expect(observerFn).toHaveBeenCalledTimes(3);
  });
});
