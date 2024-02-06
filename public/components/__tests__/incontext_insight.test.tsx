/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { IncontextInsight } from '../incontext_insight';
import { getChrome, getNotifications, getIncontextInsightRegistry } from '../../services';

jest.mock('../../services');

beforeEach(() => {
  (getChrome as jest.Mock).mockImplementation(() => ({
    logos: 'mocked logos',
  }));
  (getNotifications as jest.Mock).mockImplementation(() => ({
    toasts: {
      addSuccess: jest.fn(),
      addError: jest.fn(),
    },
  }));
  (getIncontextInsightRegistry as jest.Mock).mockImplementation(() => {});
});

describe('IncontextInsight', () => {
  afterEach(cleanup);

  it('renders the children', () => {
    const { getByText } = render(
      <IncontextInsight>
        <div>Test child</div>
      </IncontextInsight>
    );

    expect(getByText('Test child')).toBeInTheDocument();
  });

  it('calls the service functions on render', () => {
    render(
      <IncontextInsight>
        <div>Test child</div>
      </IncontextInsight>
    );

    expect(getChrome).toHaveBeenCalled();
    expect(getNotifications).toHaveBeenCalled();
    expect(getIncontextInsightRegistry).toHaveBeenCalled();
  });

  it('creates a div with id "incontext-insight-target" on document body', () => {
    render(
      <IncontextInsight>
        <div>Test child</div>
      </IncontextInsight>
    );

    const targetDiv = document.getElementById('incontext-insight-target');
    expect(targetDiv).not.toBeNull();
  });
});
