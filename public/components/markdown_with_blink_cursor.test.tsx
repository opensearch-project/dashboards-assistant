/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  MarkdownWithBlinkCursor,
  getMostRightLeafNode,
  getNonVoidParent,
} from './markdown_with_blink_cursor';

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

describe('getMostRightLeafNode', () => {
  it('should return right most leaf node', () => {
    const div = document.createElement('div');
    const result = getMostRightLeafNode(div);
    expect(result).toEqual(div);
  });

  it('should return paragraph node', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div>
        <p>paragraph 1</p>
        <ul>
          <li>list item 1</li>
          <li>list item 2</li>
        </ul>
        <p>para graph 2</p>
      </div>
    `;
    const result = getMostRightLeafNode(div) as Element;
    expect(div.childNodes[2]).toEqual(result);
  });

  it('should return br node for list item', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div>
        <p>paragraph 1</p>
        <ul>
          <li>list item 1</li>
          <li>list item 2</li>`;
    const result = getMostRightLeafNode(div) as Element;
    expect(result.textContent).toEqual('list item 2');
  });

  it('should return br node when there is an empty line', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div>
        <p>paragraph 1</p>
        <ul>
          <li>list item 1</li>
          <li>list item 2</li>
    `;
    const result = getMostRightLeafNode(div) as Element;
    expect(result.textContent).toMatchInlineSnapshot(`
      "
          "
    `);
  });

  it('should return itself if no children can be found after ignore check', () => {
    const div = document.createElement('div');
    div.innerHTML = `
    
    
    
    `;
    const result = getMostRightLeafNode(div, (node) => !node.textContent?.trim());
    expect(result).toEqual(div);
  });
});

describe('getNonVoidParent', () => {
  it('should return parent', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div>
        <p>paragraph 1</p>
        <ul>
          <li>list item 1</li>
          <li>list item 2</li>
        </ul>
        <p>para graph 2</p>
        <img />
      </div>
    `;

    const result = getNonVoidParent(div.querySelector('img'));

    expect(result).toEqual(div.childNodes[1]);
  });

  it('should return null if input is null', () => {
    expect(getNonVoidParent(null)).toEqual(null);
  });
});

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

  it('should append blink cursor element into correct position', async () => {
    const markdown = `\n- list item 1\n- list item 2`;
    const { container, findByTestId, getByTestId } = render(
      <MarkdownWithBlinkCursor loading>{markdown}</MarkdownWithBlinkCursor>
    );
    await findByTestId('AssistantBlinkCursor');
    expect(getByTestId('AssistantBlinkCursor').parentNode?.textContent).toEqual('list item 2');
  });
});
