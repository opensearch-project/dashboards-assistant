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
import { TEXT2VEGA_AGENT_CONFIG_ID } from '../../../common/constants/llm';
import { getAssistantService } from '../../services';

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

  const onSetDataSourceOptions = useCallback(
    async (options: DataSourceGroup[]) => {
      // Only support index pattern type of data set
      const indexPatternOptions = options.find(
        (item) => item.groupType === 'DEFAULT_INDEX_PATTERNS'
      );

      if (!indexPatternOptions) {
        return;
      }

      // Group index pattern ids by data source id
      const dataSourceIdToIndexPatternIds: Record<string, string[]> = {};
      const promises = currentDataSources.map(async (dataSource) => {
        const { dataSets } = await dataSource.getDataSet();
        if (Array.isArray(dataSets)) {
          /**
           * id: the index pattern id
           * dataSourceId: the data source id
           */
          for (const { id, dataSourceId = 'DEFAULT' } of dataSets) {
            if (!dataSourceIdToIndexPatternIds[dataSourceId]) {
              dataSourceIdToIndexPatternIds[dataSourceId] = [];
            }
            dataSourceIdToIndexPatternIds[dataSourceId].push(id);
          }
        }
      });
      await Promise.allSettled(promises);

      const assistantService = getAssistantService();
      /**
       * Check each data source to see if text to vega agent is configured or not
       * If not configured, disable the corresponding index pattern from the selection list
       */
      Object.keys(dataSourceIdToIndexPatternIds).forEach(async (key) => {
        const res = await assistantService.client.agentConfigExists(TEXT2VEGA_AGENT_CONFIG_ID, {
          dataSourceId: key !== 'DEFAULT' ? key : undefined,
        });
        if (!res.exists) {
          dataSourceIdToIndexPatternIds[key].forEach((indexPatternId) => {
            indexPatternOptions.options.forEach((option) => {
              if (option.value === indexPatternId) {
                option.disabled = true;
              }
            });
          });
        }
      });

      setDataSourceOptions([indexPatternOptions]);
    },
    [currentDataSources]
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
      setDataSourceOptionList={onSetDataSourceOptions}
      onDataSourceSelect={onDataSourceSelect}
      selectedSources={selectedSources}
      onGetDataSetError={handleGetDataSetError}
      onRefresh={memorizedReload}
      fullWidth
    />
  );
};
