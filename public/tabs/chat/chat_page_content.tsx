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
import React, { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IMessage, Interaction } from '../../../common/types/chat_saved_object_attributes';
import { WelcomeMessage } from '../../components/chat_welcome_message';
import { useChatContext } from '../../contexts';
import { useChatState, useChatActions } from '../../hooks';
import { findLastIndex } from '../../utils';
import { MessageBubble } from './messages/message_bubble';
import { MessageContent } from './messages/message_content';
import { SuggestionBubble } from './suggestions/suggestion_bubble';
import { getIncontextInsightRegistry } from '../../services';
import { getConfigSchema } from '../../services';
import { LLMResponseType } from '../../hooks/use_chat_state';
import { LoadingPlaceholder } from './loading_placeholder';

interface ChatPageContentProps {
  messagesLoading: boolean;
  conversationsLoading: boolean;
  messagesLoadingError?: Error;
  chatScrollTopRef: React.MutableRefObject<{ scrollTop: number; height: number } | null>;
  conversationsError?: Error;
  onRefreshConversation: () => void;
  onRefreshConversationsList: () => void;
}

/**
 * This height is approximately the sum of header height, bottom input box and corresponding
 * paddings. It is used to calculate the height of spacing when a user inputs a message as we
 * want to achieve the behavior of the input message scrolling to the top. This value is
 * hard-coded since these heights are non-responsive.
 */
const CHAT_PAGE_CONTENT_PADDING_HEIGHT = 135;

export const ChatPageContent: React.FC<ChatPageContentProps> = React.memo((props) => {
  const chatContext = useChatContext();
  const { chatState } = useChatState();
  const pageEndRef = useRef<HTMLDivElement>(null);
  const loading = props.messagesLoading || chatState.llmResponding;
  const chatActions = useChatActions();
  const registry = getIncontextInsightRegistry();
  const configSchema = getConfigSchema();
  const latestInputRef = useRef<HTMLDivElement | null>(null);
  const [messageSpacerHeight, setMessageSpacerHeight] = useState(0);

  useLayoutEffect(() => {
    if (loading && latestInputRef.current) {
      setMessageSpacerHeight(
        window.innerHeight - latestInputRef.current.clientHeight - CHAT_PAGE_CONTENT_PADDING_HEIGHT
      );

      requestAnimationFrame(() => {
        // Do the scrolling in the next tick to avoid page flashing
        if (latestInputRef.current) {
          latestInputRef.current.scrollIntoView({ behavior: 'smooth' });
          // Since we only scroll once user send message, we can remove the ref directly after scroll
          latestInputRef.current = null;
        }
      });
    }
  }, [loading, window.innerHeight]);

  useEffect(() => {
    // Always clear the height when reopen the chat window or load new chat
    setMessageSpacerHeight(0);

    if (pageEndRef.current) {
      pageEndRef.current.scrollIntoView();
    }
  }, [pageEndRef.current, setMessageSpacerHeight]);

  if (props.conversationsError) {
    return (
      <>
        <EuiSpacer size="xl" />
        <EuiEmptyPrompt
          icon={<EuiIcon type="alert" color="danger" size="xl" />}
          title={<h1>Error loading conversation</h1>}
          body={props.conversationsError.message}
          titleSize="l"
          actions={
            <EuiSmallButton
              className="llm-chat-error-refresh-button"
              fill
              iconType="refresh"
              onClick={props.onRefreshConversationsList}
            >
              Refresh
            </EuiSmallButton>
          }
        />
      </>
    );
  }
  if (props.messagesLoading || props.conversationsLoading) {
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

  if (props.messagesLoadingError && chatState.messages.length === 0) {
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
              onClick={props.onRefreshConversation}
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

  // The state after user sent a message and waiting for server's message (loading)
  const isWaitingForRepsonse = loading && chatState.llmResponseType !== LLMResponseType.STREAMING;

  return (
    <>
      <MessageBubble
        message={{ type: 'output', contentType: 'markdown', content: '' }}
        showActionBar={false}
      >
        <WelcomeMessage username={chatContext?.currentAccount?.username} />
      </MessageBubble>
      {props.messagesLoading && chatState.messages.length > 0 && (
        <>
          <EuiSpacer />
          <MessageBubble loading showActionBar={false} />
        </>
      )}
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
        // The latest user input, just after the last user input
        const isLatestInput = lastInputIndex === i;
        // The latest llm output, just after the last user input
        const isLatestOutput = lastInputIndex >= 0 && i > lastInputIndex;
        // All the llm output in response to user's input, exclude outputs before user's first input
        const isChatOutput = firstInputIndex >= 0 && i > firstInputIndex;
        // Only show suggestion on llm outputs after last user input
        const showSuggestions = i > lastInputIndex && !chatState.llmResponding;

        let interaction: Interaction | undefined;
        if (message.type === 'output' && message.interactionId) {
          interaction = chatState.interactions.find(
            (item) => item.interaction_id === message.interactionId
          );
          registry.setInteractionId(interaction);
        }

        const showActionBar =
          isChatOutput &&
          (chatState.llmResponseType === LLMResponseType.TEXT ||
            (chatState.llmResponseType === LLMResponseType.STREAMING && !chatState.llmResponding));

        // The latest llm output, after the llm has responded at least a message
        const isStreamingMessage =
          isLatestOutput &&
          chatState.llmResponseType === LLMResponseType.STREAMING &&
          chatState.llmResponding;

        return (
          <div
            key={`${interaction?.conversation_id}-${i}`}
            ref={isLatestInput && isWaitingForRepsonse ? latestInputRef : undefined}
            style={
              isLatestOutput
                ? {
                    minHeight: messageSpacerHeight,
                  }
                : {}
            }
          >
            <ToolsUsed message={message} />
            <MessageBubble
              message={message}
              showActionBar={showActionBar}
              showRegenerate={isLatestOutput && configSchema.chat.regenerateMessage}
              shouldActionBarVisibleOnHover={!isLatestOutput}
              onRegenerate={chatActions.regenerate}
              interaction={interaction}
            >
              <MessageContent message={message} loading={isStreamingMessage} />
            </MessageBubble>
            <EuiSpacer />
            {showSuggestions && <Suggestions message={message} inputDisabled={loading} />}
          </div>
        );
      })}
      <LoadingPlaceholder loading={isWaitingForRepsonse} height={messageSpacerHeight}>
        {configSchema.chat.regenerateMessage &&
          chatState.llmResponding &&
          chatContext.conversationId && (
            <div style={{ marginLeft: '8px', marginTop: 10 }}>
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
      </LoadingPlaceholder>
      {chatState.llmError && (
        <div style={{ minHeight: messageSpacerHeight }}>
          <EuiEmptyPrompt
            iconType="alert"
            iconColor="danger"
            title={<h2>Error from response</h2>}
            body={chatState.llmError.message}
          />
        </div>
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
    <div aria-label="chat suggestions" style={{ marginLeft: '8px', marginBottom: '5px' }}>
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
