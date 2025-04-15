/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiMarkdownFormat, EuiMarkdownFormatProps } from '@elastic/eui';
import React, { useRef, useEffect } from 'react';

const voidElements = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

function isVoidElements(tagName: string | null) {
  if (!tagName) {
    return true;
  }

  return voidElements.includes(tagName.toLowerCase());
}

function getTagName(node: Node | HTMLElement): string | null {
  // Check if the node is an element node
  if (node.nodeType === Node.ELEMENT_NODE) {
    // It's safe to cast to Element and access tagName
    return (node as Element).tagName.toLowerCase();
  }

  // For non-element nodes (text nodes, comment nodes, etc.)
  return null;
}

/**
 * Find most right leaf node
 * @param node
 * @returns
 */
export function getMostRightLeafNode(
  node: HTMLElement | Node,
  ifIgnore: (node: Node) => boolean = () => false
): Node {
  if (node.childNodes.length === 0) {
    return node;
  }

  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (ifIgnore(child)) {
      continue;
    }

    return getMostRightLeafNode(child, ifIgnore);
  }

  return node;
}

/**
 * Find last non-void node so that the blink cursor can be append into that node
 * @param node
 * @returns
 */
export function getNonVoidParent(node: ParentNode | Node | null): Node | null | undefined {
  if (!node) {
    return null;
  }

  if (isVoidElements(getTagName(node))) {
    return getNonVoidParent(node.parentNode);
  }

  return node;
}

/**
 * Ignore node that will be empty after trim
 * @param node
 * @returns
 */
export function ignoreEmptyNode(node: Node): boolean {
  return !node.textContent?.trim();
}

export const MarkdownWithBlinkCursor = (props: EuiMarkdownFormatProps & { loading?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let blinkCursorNode: undefined | HTMLSpanElement;
    if (props.loading && ref.current) {
      const mostRightLeafNode = getMostRightLeafNode(ref.current, ignoreEmptyNode);
      const lastNonVoidNode = getNonVoidParent(mostRightLeafNode);
      blinkCursorNode = document.createElement('span');
      blinkCursorNode.classList.add('assistant_blinkCursor');
      blinkCursorNode.dataset.testSubj = 'AssistantBlinkCursor';
      if (lastNonVoidNode) {
        lastNonVoidNode.appendChild(blinkCursorNode);
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
