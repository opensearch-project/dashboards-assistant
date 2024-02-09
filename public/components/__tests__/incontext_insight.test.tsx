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

  it('renders the child', () => {
    const { getByText } = render(
      <IncontextInsight>
        <div>Test child</div>
      </IncontextInsight>
    );

    expect(getByText('Test child')).toBeInTheDocument();
  });

  it('renders the children', () => {
    const { getByText } = render(
      <IncontextInsight>
        <div>
          <h3>Test child</h3>
          <div>Test child 2</div>
        </div>
      </IncontextInsight>
    );

    expect(getByText('Test child')).toBeInTheDocument();
  });
});
