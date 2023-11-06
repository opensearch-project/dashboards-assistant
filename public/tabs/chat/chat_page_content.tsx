/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useLayoutEffect, useRef } from 'react';
import { useObservable } from 'react-use';
import { IMessage } from '../../../common/types/chat_saved_object_attributes';
import { TermsAndConditions } from '../../components/terms_and_conditions';
import { useChatContext } from '../../contexts/chat_context';
import { useChatState } from '../../hooks/use_chat_state';
import { ChatPageGreetings } from './chat_page_greetings';
import { MessageBubble } from './messages/message_bubble';
import { MessageContent } from './messages/message_content';
import { MessageFooter } from './messages/message_footer';
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

  if (props.messagesLoadingError) {
    return (
      <EuiEmptyPrompt
        iconType="alert"
        iconColor="danger"
        title={<h2>Error loading chat history</h2>}
        body={props.messagesLoadingError.message}
      />
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
        chatState.messages
          .flatMap((message, i, array) => [
            <ToolsUsed key={`tool-${i}`} message={message} />,
            // Currently new messages will only be appended at the end (no reorders), using index as key is ok.
            // If fetching a limited size of latest messages is supported in the future, then key should be message id.
            <MessageBubble
              key={`message-${i}`}
              type={message.type}
              contentType={message.contentType}
              showActionBar={firstInputIndex > 0 && i > firstInputIndex}
              showRegenerate={lastInputIndex > 0 && i > lastInputIndex}
              content={message.content}
            >
              <MessageContent message={message} />
              {/* <MessageFooter message={message} previousInput={findPreviousInput(array, i)} />*/}
            </MessageBubble>,
            <Suggestions key={`suggestion-${i}`} message={message} inputDisabled={loading} />,
            <EuiSpacer key={`spacer-${i}`} />,
          ])
          // slice(0, -1) to remove last EuiSpacer
          .slice(0, -1)}
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

  if (
    props.message.type !== 'output' ||
    !props.message.suggestedActions ||
    props.message.suggestedActions.length === 0
  ) {
    return null;
  }

  return (
    <div style={{ marginLeft: '55px', marginTop: '5px' }}>
      <EuiText color="subdued" size="xs" style={{ paddingLeft: 10 }}>
        <small>Available suggestions</small>
      </EuiText>
      {props.message.suggestedActions
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
            <EuiFlexGroup alignItems="flexStart" direction="column" gutterSize="s">
              <EuiFlexItem>
                <SuggestionBubble
                  onClick={() =>
                    !props.inputDisabled && executeAction(suggestedAction, props.message)
                  }
                  color={props.inputDisabled ? 'subdued' : 'default'}
                  content={suggestedAction.message}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        ))}
    </div>
  );
};
