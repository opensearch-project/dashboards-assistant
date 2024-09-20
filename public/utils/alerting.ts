/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import rison from 'rison-node';
import { stringify } from 'query-string';
import { buildCustomFilter } from '../../../../src/plugins/data/common';
import { url } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import {
  DataPublicPluginStart,
  opensearchFilters,
  DuplicateIndexPatternError,
  IndexPattern,
} from '../../../../src/plugins/data/public';
import { CoreStart } from '../../../../src/core/public';

export const buildFilter = (indexPatternId: string, dsl: Record<string, unknown>) => {
  const filterAlias = 'Alerting-filters';
  return buildCustomFilter(
    indexPatternId,
    dsl,
    false,
    false,
    filterAlias,
    opensearchFilters.FilterStateStore.APP_STATE
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
    if (err instanceof DuplicateIndexPatternError) {
      const result = await dataStart.indexPatterns.find(patternName);
      if (result && result[0]) {
        pattern = result[0];
      }
      console.error('Duplicate index pattern', err.message);
    } else {
      console.error('err', err.message);
    }
  }
  return pattern;
};

export const buildUrlQuery = async (
  dataStart: DataPublicPluginStart,
  savedObjects: CoreStart['savedObjects'],
  indexPattern: IndexPattern,
  dsl: Record<string, unknown>,
  timeDsl: Record<'from' | 'to', string>,
  dataSourceId?: string
) => {
  const filter = buildFilter(indexPattern.id!, dsl);

  const filterManager = dataStart.query.filterManager;
  // There are some map and flatten operations to filters in filterManager, use this to keep aligned with discover.
  filterManager.setAppFilters([filter]);
  const filters = filterManager.getAppFilters();

  const refreshInterval = {
    pause: true,
    value: 0,
  };
  const time = {
    from: timeDsl.from,
    to: timeDsl.to,
  };
  let indexPatternTitle = indexPattern.title;
  if (dataSourceId) {
    try {
      const dataSourceObject = await savedObjects.client.get('data-source', dataSourceId);
      const dataSourceTitle = dataSourceObject?.get('title');
      // If index pattern refers to a data source, discover list will display data source name as dataSourceTitle::indexPatternTitle
      indexPatternTitle = `${dataSourceTitle}::indexPatternTitle`;
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
        timeFiledName: indexPattern.timeFieldName,
        title: indexPatternTitle,
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
