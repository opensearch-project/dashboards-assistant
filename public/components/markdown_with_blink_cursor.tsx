/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiMarkdownFormat, EuiMarkdownFormatProps } from '@elastic/eui';
import React from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';

function getLastTextNode(node: HTMLElement | Node): Node | null | undefined {
  if (node.nodeType === node.TEXT_NODE) {
    return node;
  }
  const children = node.childNodes;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    const result = getLastTextNode(child);
    if (result) {
      return result;
    }
    return null;
  }
}

export const MarkdownWithBlinkCursor = (props: EuiMarkdownFormatProps & { loading?: boolean }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let blinkCursorNode: undefined | HTMLSpanElement;
    if (props.loading && ref.current) {
      const lastNode = getLastTextNode(ref.current);
      blinkCursorNode = document.createElement('span');
      blinkCursorNode.classList.add('assistant_blinkCursor');
      if (lastNode) {
        lastNode.parentNode?.appendChild(blinkCursorNode);
      }
    }

    return () => {
      blinkCursorNode?.remove();
    };
  }, [props.children, props.loading]);
  return (
    <div className="markdown_with_blink_cursor" ref={ref}>
      <EuiMarkdownFormat>{props.children}</EuiMarkdownFormat>
    </div>
  );
};
