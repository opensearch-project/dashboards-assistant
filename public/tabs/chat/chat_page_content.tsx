/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useLayoutEffect, useRef } from 'react';
import { useObservable } from 'react-use';
import { IMessage, ISuggestedAction } from '../../../common/types/chat_saved_object_attributes';
import { TermsAndConditions } from '../../components/terms_and_conditions';
import { useChatContext } from '../../contexts/chat_context';
import { useChatState } from '../../hooks/use_chat_state';
import { ChatPageGreetings } from './chat_page_greetings';
import { MessageBubble } from './messages/message_bubble';
import { MessageContent } from './messages/message_content';
import { SuggestionBubble } from './suggestions/suggestion_bubble';
import { useChatActions } from '../../hooks/use_chat_actions';
import { useCore } from '../../contexts/core_context';
import { SavedObjectManager } from '../../services/saved_object_manager';
import { ChatConfig } from '../../types';
import { CHAT_CONFIG_SAVED_OBJECT_TYPE } from '../../../common/constants/saved_objects';

interface ChatPageContentProps {
  showGreetings: boolean;
  setShowGreetings: React.Dispatch<React.SetStateAction<boolean>>;
  messagesLoading: boolean;
  messagesLoadingError?: Error;
  onRefresh: () => void;
}

const findPreviousInput = (messages: IMessage[], index: number) => {
  for (let i = index - 1; i >= 0; i--) {
    if (messages[i].type === 'input') return messages[i];
  }
};

export const ChatPageContent: React.FC<ChatPageContentProps> = React.memo((props) => {
  const core = useCore();
  const chatContext = useChatContext();
  const { chatState } = useChatState();
  const pageEndRef = useRef<HTMLDivElement>(null);
  const loading = props.messagesLoading || chatState.llmResponding;
  const chatActions = useChatActions();

  const chatConfigService = SavedObjectManager.getInstance<ChatConfig>(
    core.services.savedObjects.client,
    CHAT_CONFIG_SAVED_OBJECT_TYPE
  );
  const config = useObservable(chatConfigService.get$(chatContext.currentAccount.username));
  const termsAccepted = Boolean(config?.terms_accepted);

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
            <EuiButton
              className="llm-chat-error-refresh-button"
              fill
              iconType="refresh"
              onClick={props.onRefresh}
            >
              Refresh
            </EuiButton>
          }
        />
      </>
    );
  }

  const firstInputIndex = chatState.messages.findIndex((msg) => msg.type === 'input');
  const lastInputIndex = chatState.messages.findLastIndex((msg) => msg.type === 'input');

  return (
    <>
      <MessageBubble type="output" contentType="markdown" showActionBar={false}>
        <TermsAndConditions username={chatContext.currentAccount.username} />
      </MessageBubble>
      <EuiSpacer />
      {props.showGreetings && <ChatPageGreetings dismiss={() => props.setShowGreetings(false)} />}
      {termsAccepted &&
        chatState.messages.map((message, i) => {
          // The latest llm output, just after the last user input
          const isLatestOutput = lastInputIndex > 0 && i > lastInputIndex;
          // All the llm output in response to user's input, exclude outputs before user's first input
          const isChatOutput = firstInputIndex > 0 && i > firstInputIndex;
          // Only show suggestion on llm outputs after last user input
          const showSuggestions = i > lastInputIndex;

          return (
            <React.Fragment key={i}>
              <ToolsUsed message={message} />
              <MessageBubble
                type={message.type}
                contentType={message.contentType}
                showActionBar={isChatOutput}
                showRegenerate={isLatestOutput}
                shouldActionBarVisibleOnHover={!isLatestOutput}
                onRegenerate={chatActions.regenerate}
                content={message.content}
              >
                <MessageContent message={message} />
                {/* <MessageFooter message={message} previousInput={findPreviousInput(array, i)} />*/}
              </MessageBubble>
              {showSuggestions && <Suggestions message={message} inputDisabled={loading} />}
              <EuiSpacer />
            </React.Fragment>
          );
        })}
      {loading && (
        <>
          <EuiSpacer />
          <MessageBubble type="loading" showActionBar={false} />
        </>
      )}
      {chatState.llmResponding && chatContext.sessionId && (
        <div style={{ marginLeft: '55px', marginTop: 10 }}>
          <EuiFlexGroup alignItems="flexStart" direction="column" gutterSize="s">
            <EuiFlexItem>
              <SuggestionBubble
                content="Stop generating response"
                color="default"
                iconType="crossInACircleFilled"
                onClick={() => chatActions.abortAction(chatContext.sessionId)}
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

  if (props.message.type !== 'output') {
    return null;
  }
  const traceId = props.message.traceId;

  const suggestedActions = structuredClone(props.message.suggestedActions) || [];
  if (traceId) {
    const viewTraceAction: ISuggestedAction = {
      actionType: 'view_trace',
      metadata: { traceId, icon: 'questionInCircle' },
      message: 'How was this generated?',
    };
    suggestedActions.push(viewTraceAction);
  }

  if (!suggestedActions.length) {
    return null;
  }

  return (
    <div style={{ marginLeft: '55px', marginTop: '5px' }}>
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
                  iconType={suggestedAction.metadata?.icon}
                />
              </EuiFlexItem>
            </div>
          ))}
      </EuiFlexGroup>
    </div>
  );
};
