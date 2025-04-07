/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { MarkdownWithBlinkCursor } from './markdown_with_blink_cursor';

const NewMarkdownCursor = () => {
  const [loading, setLoading] = useState<boolean>(true);
  return (
    <>
      <button data-test-subj="btn" onClick={() => setLoading((state) => !state)}>
        foo button
      </button>
      <MarkdownWithBlinkCursor loading={loading}>foo</MarkdownWithBlinkCursor>
    </>
  );
};

describe('<MarkdownWithBlinkCursor />', () => {
  it('should not append assistant_blinkCursor when not loading', () => {
    const { container } = render(
      <MarkdownWithBlinkCursor loading={false}>foo</MarkdownWithBlinkCursor>
    );
    expect(container.querySelector('.assistant_blinkCursor')).toBeNull();
  });

  it('should remove assistant_blinkCursor when loading state get changed', async () => {
    const { container, getByTestId } = render(<NewMarkdownCursor />);
    expect(container.querySelector('.assistant_blinkCursor')).toBeInTheDocument();
    await fireEvent.click(getByTestId('btn'));
    expect(container.querySelector('.assistant_blinkCursor')).toBeNull();
  });
});
