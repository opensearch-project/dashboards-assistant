/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import * as coreContextExports from '../contexts/core_context';
import { CoreVisualization } from './core_visualization';

jest.mock('../../../../src/plugins/embeddable/public', () => ({
  ViewMode: jest.requireActual('../../../../src/plugins/embeddable/public/lib').ViewMode,
}));

describe('<CoreVisualization />', () => {
  beforeEach(() => {
    jest.spyOn(coreContextExports, 'useCore').mockReturnValue({
      services: {
        uiSettings: {
          get: jest.fn().mockReturnValue('MMM D, YYYY @ HH:mm:ss.SSS'),
        },
        startDeps: {
          dashboard: {
            DashboardContainerByValueRenderer: () => <div />,
          },
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display visualization of last 15 minutes by default', () => {
    render(
      <CoreVisualization
        message={{ type: 'output', contentType: 'visualization', content: 'vis_id_mock' }}
      />
    );
    expect(screen.queryByText('Last 15 minutes')).toBeInTheDocument();
  });
});
