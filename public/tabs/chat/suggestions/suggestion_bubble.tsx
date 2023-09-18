/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiText } from '@elastic/eui';
import React from 'react';
import { IMessage, ISuggestedAction } from '../../../../common/types/chat_saved_object_attributes';
import { useChatActions } from '../../../hooks/use_chat_actions';

interface SuggestionBubbleProps {
  message: IMessage;
  suggestedAction: ISuggestedAction;
  inputDisabled: boolean;
}

export const SuggestionBubble: React.FC<SuggestionBubbleProps> = (props) => {
  const { executeAction } = useChatActions();
  return (
    <EuiFlexGroup justifyContent="flexStart">
      <EuiFlexItem grow={false}>
        {/* EuiButton does not have good support for long text */}
        <EuiPanel
          className="llm-chat-suggestion-bubble-panel"
          onClick={() => executeAction(props.suggestedAction, props.message)}
          grow={false}
          paddingSize="none"
          disabled={props.inputDisabled}
        >
          <EuiText size="xs" color={props.inputDisabled ? 'subdued' : 'default'}>
            {'\u{1f4ad} ' + props.suggestedAction.message}
          </EuiText>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
