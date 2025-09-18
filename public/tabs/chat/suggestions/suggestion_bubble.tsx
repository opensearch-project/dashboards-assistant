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
  actionType: string;
}

export const SuggestionBubble: React.FC<SuggestionBubbleProps> = ({
  onClick,
  color,
  content,
  iconType = 'chatRight',
  actionType,
}: SuggestionBubbleProps) => {
  // Determine if this is a custom suggestion from a plugin
  const isCustomSuggestion = actionType === 'customize';

  // Use different icon for custom suggestions
  const suggestionIcon = isCustomSuggestion ? 'faceHappy' : iconType;

  // Build CSS classes for visual distinction
  const panelClasses = [
    'llm-chat-suggestion-bubble-panel',
    isCustomSuggestion
      ? 'llm-chat-suggestion-bubble-panel--custom'
      : 'llm-chat-suggestion-bubble-panel--default',
  ].join(' ');

  return (
    <EuiPanel
      hasShadow={false}
      hasBorder={false}
      element="div"
      className={panelClasses}
      onClick={onClick}
      grow={false}
      paddingSize="none"
      data-test-subj={isCustomSuggestion ? 'custom-suggestion-bubble' : 'default-suggestion-bubble'}
    >
      <EuiFlexGroup gutterSize="none" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={suggestionIcon}
            style={{ marginRight: 5 }}
            color={isCustomSuggestion ? 'primary' : undefined}
          />
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
