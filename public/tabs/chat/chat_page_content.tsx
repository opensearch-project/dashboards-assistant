/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiSmallButton,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useLayoutEffect, useRef } from 'react';
import {
  IMessage,
  ISuggestedAction,
  Interaction,
} from '../../../common/types/chat_saved_object_attributes';
import { WelcomeMessage } from '../../components/chat_welcome_message';
import { useChatContext } from '../../contexts';
import { useChatState, useChatActions } from '../../hooks';
import { findLastIndex } from '../../utils';
import { MessageBubble } from './messages/message_bubble';
import { MessageContent } from './messages/message_content';
import { SuggestionBubble } from './suggestions/suggestion_bubble';
import { getIncontextInsightRegistry } from '../../services';

interface ChatPageContentProps {
  messagesLoading: boolean;
  messagesLoadingError?: Error;
  onRefresh: () => void;
}

export const ChatPageContent: React.FC<ChatPageContentProps> = React.memo((props) => {
  const chatContext = useChatContext();
  const { chatState } = useChatState();
  const pageEndRef = useRef<HTMLDivElement>(null);
  const loading = props.messagesLoading || chatState.llmResponding;
  const chatActions = useChatActions();
  const registry = getIncontextInsightRegistry();

  useLayoutEffect(() => {
    pageEndRef.current?.scrollIntoView();
  }, [chatState.messages, loading]);

  if (props.messagesLoading) {
    return (
      <>
        <EuiSpacer size="xl" />
        <EuiEmptyPrompt
          icon={<EuiLoadingSpinner size="xl" />}
          title={<h1>Loading conversation</h1>}
          titleSize="l"
        />
      </>
    );
  }

  if (props.messagesLoadingError) {
    return (
      <>
        <EuiSpacer size="xl" />
        <EuiEmptyPrompt
          icon={<EuiIcon type="alert" color="danger" size="xl" />}
          title={<h1>Error loading conversation</h1>}
          body={props.messagesLoadingError.message}
          titleSize="l"
          actions={
            <EuiSmallButton
              className="llm-chat-error-refresh-button"
              fill
              iconType="refresh"
              onClick={props.onRefresh}
            >
              Refresh
            </EuiSmallButton>
          }
        />
      </>
    );
  }

  const firstInputIndex = chatState.messages.findIndex((msg) => msg.type === 'input');
  const lastInputIndex = findLastIndex(chatState.messages, (msg) => msg.type === 'input');

  return (
    <>
      <MessageBubble
        message={{ type: 'output', contentType: 'markdown', content: '' }}
        showActionBar={false}
      >
        <WelcomeMessage username={chatContext?.currentAccount?.username} />
      </MessageBubble>
      {firstInputIndex < 0 && (
        <Suggestions
          message={{
            content: '',
            contentType: 'markdown',
            type: 'output',
            suggestedActions: [
              { message: 'What are the indices in my cluster?', actionType: 'send_as_input' },
            ],
          }}
          inputDisabled={loading}
        />
      )}
      <EuiSpacer />
      {chatState.messages.map((message, i) => {
        // The latest llm output, just after the last user input
        const isLatestOutput = lastInputIndex >= 0 && i > lastInputIndex;
        // All the llm output in response to user's input, exclude outputs before user's first input
        const isChatOutput = firstInputIndex >= 0 && i > firstInputIndex;
        // Only show suggestion on llm outputs after last user input
        const showSuggestions = i > lastInputIndex;

        let interaction: Interaction | undefined;
        if (message.type === 'output' && message.interactionId) {
          interaction = chatState.interactions.find(
            (item) => item.interaction_id === message.interactionId
          );
          registry.setInteractionId(interaction);
        }

        return (
          <React.Fragment key={`${interaction?.conversation_id}-${i}`}>
            <ToolsUsed message={message} />
            <MessageBubble
              message={message}
              showActionBar={isChatOutput}
              showRegenerate={isLatestOutput}
              shouldActionBarVisibleOnHover={!isLatestOutput}
              onRegenerate={chatActions.regenerate}
              interaction={interaction}
            >
              <MessageContent message={message} />
            </MessageBubble>
            {showSuggestions && <Suggestions message={message} inputDisabled={loading} />}
            <EuiSpacer />
          </React.Fragment>
        );
      })}
      {loading && (
        <>
          <EuiSpacer />
          <MessageBubble loading showActionBar={false} />
        </>
      )}
      {chatState.llmResponding && chatContext.conversationId && (
        <div style={{ marginLeft: '55px', marginTop: 10 }}>
          <EuiFlexGroup alignItems="flexStart" direction="column" gutterSize="s">
            <EuiFlexItem>
              <SuggestionBubble
                content="Stop generating response"
                color="default"
                iconType="crossInACircleFilled"
                onClick={() => chatActions.abortAction(chatContext.conversationId)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      )}
      {chatState.llmError && (
        <EuiEmptyPrompt
          iconType="alert"
          iconColor="danger"
          title={<h2>Error from response</h2>}
          body={chatState.llmError.message}
        />
      )}
      <div ref={pageEndRef} />
    </>
  );
});

interface ToolsUsedProps {
  message: IMessage;
}

const ToolsUsed: React.FC<ToolsUsedProps> = (props) => {
  if (props.message.type !== 'output' || !props.message.toolsUsed?.length) return null;
  return (
    <>
      {props.message.toolsUsed.map((tool, i) => (
        <React.Fragment key={i}>
          <EuiText color="subdued">
            <EuiIcon size="l" type="check" color="success" /> {tool}
          </EuiText>
          <EuiSpacer size="s" />
        </React.Fragment>
      ))}
    </>
  );
};

interface SuggestionsProps {
  message: IMessage;
  inputDisabled: boolean;
}

const Suggestions: React.FC<SuggestionsProps> = (props) => {
  const chatContext = useChatContext();
  const { executeAction } = useChatActions();
  const registry = getIncontextInsightRegistry();

  if (props.message.type !== 'output') {
    return null;
  }
  const interactionId = props.message.interactionId;

  const suggestedActions = structuredClone(props.message.suggestedActions) || [];

  if (!suggestedActions.length) {
    return null;
  }

  registry.setSuggestionsByInteractionId(interactionId, suggestedActions);

  return (
    <div aria-label="chat suggestions" style={{ marginLeft: '55px', marginTop: '5px' }}>
      <EuiText color="subdued" size="xs" style={{ paddingLeft: 10 }}>
        <small>Available suggestions</small>
      </EuiText>
      <EuiFlexGroup alignItems="flexStart" direction="column" gutterSize="s">
        {suggestedActions
          // remove actions that are not supported by the current chat context
          .filter(
            (suggestedAction) =>
              !(
                suggestedAction.actionType === 'view_ppl_visualization' &&
                !chatContext.actionExecutors.view_ppl_visualization
              )
          )
          .map((suggestedAction, i) => (
            <div key={i}>
              <EuiSpacer size="xs" />
              <EuiFlexItem grow={false}>
                <SuggestionBubble
                  onClick={() =>
                    !props.inputDisabled && executeAction(suggestedAction, props.message)
                  }
                  color={props.inputDisabled ? 'subdued' : 'default'}
                  content={suggestedAction.message}
                />
              </EuiFlexItem>
            </div>
          ))}
      </EuiFlexGroup>
    </div>
  );
};
