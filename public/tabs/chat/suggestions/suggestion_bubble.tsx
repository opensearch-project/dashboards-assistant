/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel, EuiText, IconType } from '@elastic/eui';
import React from 'react';
import { TextColor } from '@elastic/eui/src/components/text/text_color';

interface SuggestionBubbleProps {
  onClick: () => void;
  color: TextColor;
  content: string;
  iconType?: IconType;
}

export const SuggestionBubble: React.FC<SuggestionBubbleProps> = ({
  onClick,
  color,
  content,
  iconType = 'chatRight',
}: SuggestionBubbleProps) => {
  return (
    <EuiPanel
      hasShadow={false}
      hasBorder={false}
      element="div"
      className="llm-chat-suggestion-bubble-panel"
      onClick={onClick}
      grow={false}
      paddingSize="none"
    >
      <EuiFlexGroup gutterSize="none" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type={iconType} style={{ marginRight: 5 }} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="xs" color={color}>
            {content}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
