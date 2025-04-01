/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import rison from 'rison-node';
import { stringify } from 'query-string';
import moment from 'moment';
import { buildCustomFilter, FilterStateStore } from '../../../../src/plugins/data/common';
import { url } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { DataPublicPluginStart, IndexPattern, Filter } from '../../../../src/plugins/data/public';
import { CoreStart } from '../../../../src/core/public';
import { NestedRecord, DSL } from '../types';

export const buildFilter = (indexPatternId: string, dsl: DSL) => {
  const filterAlias = 'Alerting-filters';
  return buildCustomFilter(
    indexPatternId,
    dsl,
    false,
    false,
    filterAlias,
    FilterStateStore.APP_STATE
  );
};

export const createIndexPatterns = async (
  dataStart: DataPublicPluginStart,
  patternName: string,
  timeFieldName: string,
  dataSourceId?: string
) => {
  let pattern: IndexPattern | undefined;
  const dataSourceRef = dataSourceId
    ? {
        type: 'data-source',
        id: dataSourceId,
      }
    : undefined;
  try {
    pattern = await dataStart.indexPatterns.createAndSave({
      id: '',
      title: patternName,
      timeFieldName,
      dataSourceRef,
    });
  } catch (err) {
    console.error('Create index pattern error', err.message);
    // Err instanceof DuplicateIndexPatternError is not a trusted validation in some cases, so find index pattern directly.
    try {
      let result = await dataStart.indexPatterns.find(patternName);
      if (dataSourceId) {
        // Filter same name index patterns but belonged to current data source
        result = result.filter((item) => item?.dataSourceRef?.id === dataSourceId);
      }
      if (result && result[0]) {
        pattern = result[0];
      }
    } catch (e) {
      console.error('Find index pattern error', err.message);
    }
  }
  return pattern;
};

export const buildUrlQuery = async (
  dataStart: DataPublicPluginStart,
  savedObjects: CoreStart['savedObjects'],
  indexPattern: IndexPattern,
  dsl: DSL,
  timeDsl: Record<'from' | 'to', string>,
  dataSourceId?: string
) => {
  let filters: Filter[] = [];
  // If there is none filter after filtering timeRange filter, skip to build filter query.
  if ((dsl?.query?.bool?.filter?.length ?? 0) > 0) {
    const filter = buildFilter(indexPattern.id!, dsl);
    const filterManager = dataStart.query.filterManager;
    // There are some map and flatten operations to filters in filterManager, use this to keep aligned with discover.
    filterManager.setAppFilters([filter]);
    filters = filterManager.getAppFilters();
  }

  const refreshInterval = {
    pause: true,
    value: 0,
  };
  const time = {
    from: timeDsl.from,
    to: timeDsl.to,
  };
  const indexPatternTitle = indexPattern.title;
  let dataSource;
  if (dataSourceId) {
    try {
      const dataSourceObject = await savedObjects.client.get('data-source', dataSourceId);
      const dataSourceTitle = dataSourceObject?.get('title') ?? '';
      dataSource = {
        id: dataSourceId,
        title: dataSourceTitle,
        type: 'OpenSearch',
      };
    } catch (e) {
      console.error('Get data source object error');
    }
  }
  const queryState = {
    filters,
    query: {
      dataset: {
        type: 'INDEX_PATTERN',
        id: indexPattern.id,
        timeFieldName: indexPattern.timeFieldName,
        title: indexPatternTitle,
        ...(dataSource ? { dataSource } : {}),
      },
      language: 'kuery',
      query: '',
    },
  };

  // This hash is encoded based on the interface of new discover
  const hash = stringify(
    url.encodeQuery({
      _a: rison.encode({
        discover: {
          columns: ['_source'],
          isDirty: false,
          sort: [],
        },
        metadata: {
          view: 'discover',
        },
      }),
      _g: rison.encode({
        filters: [],
        refreshInterval,
        time,
      }),
      _q: rison.encode(queryState),
    }),
    { encode: false, sort: false }
  );
  return hash;
};

const validateToTimeRange = (time: string) => {
  // Alerting uses this format in to field of time range filter.
  const TO_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';
  return moment.utc(time, TO_TIME_FORMAT, true).isValid();
};

export const extractTimeRangeDSL = (filters: NestedRecord[]) => {
  let timeRangeDSL;
  let timeFieldName;
  const newFilters = filters.filter((filter) => {
    if (filter?.range && typeof filter.range === 'object') {
      for (const key of Object.keys(filter.range)) {
        const rangeValue = filter.range[key];
        if (typeof rangeValue === 'object' && 'to' in rangeValue) {
          const toValue = rangeValue.to;
          if (typeof toValue === 'string' && validateToTimeRange(toValue)) {
            timeRangeDSL = filter.range[key];
            timeFieldName = key;
            return false;
          }
        }
      }
    }
    return true;
  });
  return {
    newFilters,
    timeRangeDSL,
    timeFieldName,
  };
};
