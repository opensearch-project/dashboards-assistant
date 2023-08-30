/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// import { SavedVisualization } from '../../../../common/types/explorer';
// import { SavedObjectVisualization } from '../../visualizations/saved_object_visualization';

interface PPLVisualizationProps {
  query: string;
}

export const PPLVisualization: React.FC<PPLVisualizationProps> = (props) => {
  const savedVisualization = {
    query: props.query,
    selected_date_range: { start: 'now-14d', end: 'now', text: '' },
    selected_timestamp: { name: 'timestamp', type: 'timestamp' },
    selected_fields: { tokens: [], text: '' },
    name: 'Flight count by destination',
    description: '',
    type: 'line',
    sub_type: 'visualization',
  };
  return (
    <>TODO</>
    // <SavedObjectVisualization
    //   savedVisualization={savedVisualization}
    //   timeRange={{
    //     from: savedVisualization.selected_date_range.start,
    //     to: savedVisualization.selected_date_range.end,
    //   }}
    // />
  );
};
