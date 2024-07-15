/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';

import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  DataSource,
  DataSourceGroup,
  DataSourceSelectable,
  DataSourceOption,
} from '../../../../../src/plugins/data/public';
import { StartServices } from '../../types';

export const SourceSelector = ({
  selectedSourceId,
  onChange,
}: {
  selectedSourceId: string;
  onChange: (ds: DataSourceOption) => void;
}) => {
  const {
    services: {
      data: { dataSources },
      notifications: { toasts },
    },
  } = useOpenSearchDashboards<StartServices>();
  const [currentDataSources, setCurrentDataSources] = useState<DataSource[]>([]);
  const [dataSourceOptions, setDataSourceOptions] = useState<DataSourceGroup[]>([]);

  const selectedSources = useMemo(() => {
    if (selectedSourceId) {
      for (const group of dataSourceOptions) {
        for (const item of group.options) {
          if (item.value === selectedSourceId) {
            return [item];
          }
        }
      }
    }
    return [];
  }, [selectedSourceId, dataSourceOptions]);

  useEffect(() => {
    if (
      !selectedSourceId &&
      dataSourceOptions.length > 0 &&
      dataSourceOptions[0].options.length > 0
    ) {
      onChange(dataSourceOptions[0].options[0]);
    }
  }, [selectedSourceId, dataSourceOptions]);

  useEffect(() => {
    const subscription = dataSources.dataSourceService.getDataSources$().subscribe((ds) => {
      setCurrentDataSources(Object.values(ds));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dataSources]);

  const onDataSourceSelect = useCallback(
    (selectedDataSources: DataSourceOption[]) => {
      onChange(selectedDataSources[0]);
    },
    [onChange]
  );

  const handleGetDataSetError = useCallback(
    () => (error: Error) => {
      toasts.addError(error, {
        title:
          i18n.translate('visualize.vega.failedToGetDataSetErrorDescription', {
            defaultMessage: 'Failed to get data set: ',
          }) + (error.message || error.name),
      });
    },
    [toasts]
  );

  const memorizedReload = useCallback(() => {
    dataSources.dataSourceService.reload();
  }, [dataSources.dataSourceService]);

  return (
    <DataSourceSelectable
      dataSources={currentDataSources}
      dataSourceOptionList={dataSourceOptions}
      setDataSourceOptionList={setDataSourceOptions}
      onDataSourceSelect={onDataSourceSelect}
      selectedSources={selectedSources}
      onGetDataSetError={handleGetDataSetError}
      onRefresh={memorizedReload}
      fullWidth
    />
  );
};
