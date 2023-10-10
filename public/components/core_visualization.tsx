/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText, htmlIdGenerator, prettyDuration, ShortDate } from '@elastic/eui';
import React, { useState } from 'react';
import { DashboardContainerInput } from '../../../../src/plugins/dashboard/public';
import { ViewMode } from '../../../../src/plugins/embeddable/public';
import { IMessage } from '../../common/types/chat_saved_object_attributes';
import { useCore } from '../contexts/core_context';

interface CoreVisualizationProps {
  message: IMessage;
}

export const CoreVisualization: React.FC<CoreVisualizationProps> = (props) => {
  const core = useCore();
  const [visInput, setVisInput] = useState<DashboardContainerInput>(() =>
    createDashboardVizObject(props.message.content)
  );
  const dateFormat = core.services.uiSettings.get<string>('dateFormat');

  return (
    <>
      <EuiText size="s">
        {prettyDuration(visInput.timeRange.from, visInput.timeRange.to, [], dateFormat)}
      </EuiText>
      <core.services.startDeps.dashboard.DashboardContainerByValueRenderer
        input={visInput}
        onInputUpdated={setVisInput}
      />
    </>
  );
};

const createDashboardVizObject = (
  objectId: string,
  from: ShortDate = 'now-15m',
  to: ShortDate = 'now'
): DashboardContainerInput => {
  const vizUniqueId = htmlIdGenerator()();
  // a dashboard container object for new visualization
  return {
    viewMode: ViewMode.VIEW,
    panels: {
      '1': {
        gridData: { x: 0, y: 0, w: 50, h: 25, i: '1' },
        type: 'visualization',
        explicitInput: { id: '1', savedObjectId: objectId },
      },
    },
    isFullScreenMode: false,
    filters: [],
    useMargins: false,
    id: vizUniqueId,
    timeRange: { from, to },
    title: 'embed_viz_' + vizUniqueId,
    query: { query: '', language: 'lucene' },
    refreshConfig: { pause: true, value: 15 },
  };
};
