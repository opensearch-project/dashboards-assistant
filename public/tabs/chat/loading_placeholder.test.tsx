/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingPlaceholder } from './loading_placeholder';

// Mock the MessageBubble component since we're only testing LoadingPlaceholder
jest.mock('./messages/message_bubble', () => ({
  MessageBubble: () => <div data-test-subj="message-bubble">Loading...</div>,
}));

describe('LoadingPlaceholder', () => {
  it('should render loading placeholder when loading is true', () => {
    render(<LoadingPlaceholder loading={true} height={100} />);
    expect(screen.getByTestId('message-bubble')).toBeInTheDocument();
  });

  it('should not render loading placeholder when loading is false', () => {
    render(<LoadingPlaceholder loading={false} height={100} />);
    expect(screen.queryByTestId('message-bubble')).not.toBeInTheDocument();
  });

  it('should render children when loading', () => {
    render(
      <LoadingPlaceholder loading={true} height={100}>
        <div data-test-subj="child-element">Child Content</div>
      </LoadingPlaceholder>
    );

    expect(screen.getByTestId('message-bubble')).toBeInTheDocument();
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });
});
