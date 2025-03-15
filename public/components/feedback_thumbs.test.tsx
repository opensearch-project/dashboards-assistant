/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { METRIC_TYPE } from '@osd/analytics';

import { FeedbackThumbs } from './feedback_thumbs';

describe('<FeedbackThumbs />', () => {
  it('should report thumbs up metric', () => {
    const usageCollectionMock = {
      reportUiStats: jest.fn(),
      METRIC_TYPE,
    };

    render(<FeedbackThumbs usageCollection={usageCollectionMock} appName="test-app" />);
    fireEvent.click(screen.getByLabelText('ThumbsUp'));
    expect(usageCollectionMock.reportUiStats).toHaveBeenCalledWith(
      'test-app',
      METRIC_TYPE.CLICK,
      expect.stringMatching(/thumbup.*/)
    );
  });

  it('should report thumbs down metric', () => {
    const usageCollectionMock = {
      reportUiStats: jest.fn(),
      METRIC_TYPE,
    };

    render(<FeedbackThumbs usageCollection={usageCollectionMock} appName="test-app" />);
    fireEvent.click(screen.getByLabelText('ThumbsDown'));
    expect(usageCollectionMock.reportUiStats).toHaveBeenCalledWith(
      'test-app',
      METRIC_TYPE.CLICK,
      expect.stringMatching(/thumbdown.*/)
    );
  });

  it('should only report metric only once', () => {
    const usageCollectionMock = {
      reportUiStats: jest.fn(),
      METRIC_TYPE,
    };

    render(<FeedbackThumbs usageCollection={usageCollectionMock} appName="test-app" />);
    // click the button two times
    fireEvent.click(screen.getByLabelText('ThumbsDown'));
    fireEvent.click(screen.getByLabelText('ThumbsDown'));
    expect(usageCollectionMock.reportUiStats).toHaveBeenCalledTimes(1);
  });

  it('should hide thumbs down button after thumbs up been clicked', () => {
    const usageCollectionMock = {
      reportUiStats: jest.fn(),
      METRIC_TYPE,
    };

    render(<FeedbackThumbs usageCollection={usageCollectionMock} appName="test-app" />);

    fireEvent.click(screen.getByLabelText('ThumbsUp'));
    expect(screen.queryByLabelText('ThumbsDown')).toBeNull();
  });

  it('should hide thumbs up button after thumbs down been clicked', () => {
    const usageCollectionMock = {
      reportUiStats: jest.fn(),
      METRIC_TYPE,
    };

    render(<FeedbackThumbs usageCollection={usageCollectionMock} appName="test-app" />);

    fireEvent.click(screen.getByLabelText('ThumbsDown'));
    expect(screen.queryByLabelText('ThumbsUp')).toBeNull();
  });
});
