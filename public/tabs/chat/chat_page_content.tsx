/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiIcon, EuiSpacer, EuiText } from '@elastic/eui';
import React, { useLayoutEffect, useRef } from 'react';
import { IMessage } from '../../../common/types/chat_saved_object_attributes';
import { TermsAndConditions } from '../../components/terms_and_conditions';
import { LoadingButton } from '../../components/loading_button';
import { useChatContext } from '../../contexts/chat_context';
import { useChatState } from '../../hooks/use_chat_state';
import { ChatPageGreetings } from './chat_page_greetings';
import { MessageBubble } from './messages/message_bubble';
import { MessageContent } from './messages/message_content';
import { MessageFooter } from './messages/message_footer';
import { SuggestionBubble } from './suggestions/suggestion_bubble';

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
  const chatContext = useChatContext();
  const { chatState } = useChatState();
  const pageEndRef = useRef<HTMLDivElement>(null);
  const loading = props.messagesLoading || chatState.llmResponding;

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

  return (
    <>
      <MessageBubble type="output" contentType="markdown">
        <TermsAndConditions username={chatContext.currentAccount.username} />
      </MessageBubble>
      <EuiSpacer />
      {props.showGreetings && <ChatPageGreetings dismiss={() => props.setShowGreetings(false)} />}
      {chatState.messages
        .flatMap((message, i, array) => [
          <ToolsUsed key={`tool-${i}`} message={message} />,
          // Currently new messages will only be appended at the end (no reorders), using index as key is ok.
          // If fetching a limited size of latest messages is supported in the future, then key should be message id.
          <MessageBubble key={`message-${i}`} type={message.type} contentType={message.contentType}>
            <MessageContent message={message} />
            <MessageFooter message={message} previousInput={findPreviousInput(array, i)} />
          </MessageBubble>,
          <Suggestions key={`suggestion-${i}`} message={message} inputDisabled={loading} />,
          <EuiSpacer key={`spacer-${i}`} />,
        ])
        // slice(0, -1) to remove last EuiSpacer
        .slice(0, -1)}
      {loading && <LoadingButton />}
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
  if (props.message.type !== 'output' || !props.message.suggestedActions) return null;
  return (
    <>
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
          <React.Fragment key={i}>
            <EuiSpacer size="m" />
            <SuggestionBubble
              inputDisabled={props.inputDisabled}
              message={props.message}
              suggestedAction={suggestedAction}
            />
          </React.Fragment>
        ))}
    </>
  );
};
