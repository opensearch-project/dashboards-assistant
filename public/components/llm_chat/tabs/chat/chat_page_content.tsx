/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiIcon, EuiSpacer, EuiText } from '@elastic/eui';
import React, { useContext, useEffect, useRef } from 'react';
import { IMessage } from '../../../../../common/types/observability_saved_object_attributes';
import { ChatStateContext } from '../../chat_header_button';
import { LoadingButton } from '../../components/loading_button';
import { ChatPageGreetings } from './chat_page_greetings';
import { MessageBubble } from './message_bubble';
import { MessageContent } from './message_content';
import { SuggestionBubble } from './suggested_actions/suggestion_bubble';

interface ChatPageContentProps {
  showGreetings: boolean;
  setShowGreetings: React.Dispatch<React.SetStateAction<boolean>>;
  messagesLoading: boolean;
  messagesLoadingError?: Error;
  inputDisabled: boolean;
}

const findPreviousInput = (messages: IMessage[], index: number) => {
  for (let i = index; i >= 0; i--) {
    if (messages[i].type === 'input') return messages[i];
  }
};

export const ChatPageContent: React.FC<ChatPageContentProps> = React.memo((props) => {
  const chatStateContext = useContext(ChatStateContext)!;
  const pageEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    pageEndRef.current?.scrollIntoView();
  }, [chatStateContext.chatState.messages, chatStateContext.chatState.llmResponding]);

  if (props.messagesLoading && !chatStateContext.chatState.messages.length) {
    return <LoadingButton />;
  } else if (props.messagesLoadingError) {
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
      {props.showGreetings && <ChatPageGreetings dismiss={() => props.setShowGreetings(false)} />}
      {chatStateContext.chatState.messages
        .flatMap((message, i, array) => [
          <ToolsUsed key={`tool-${i}`} message={message} />,
          // Currently new messages will only be appended at the end (no reorders), using index as key is ok.
          // If fetching a limited size of latest messages is supported in the future, then key should be message id.
          <MessageBubble key={`message-${i}`} type={message.type} contentType={message.contentType}>
            <MessageContent message={message} previousInput={findPreviousInput(array, i)} />
          </MessageBubble>,
          <Suggestions
            key={`suggestion-${i}`}
            message={message}
            inputDisabled={props.inputDisabled}
          />,
          <EuiSpacer key={`message-spacer-${i}`} />,
        ])
        // slice(0, -1) to remove last EuiSpacer
        .slice(0, -1)}
      {chatStateContext.chatState.llmResponding && <LoadingButton />}
      {chatStateContext.chatState.llmError && (
        <EuiEmptyPrompt
          iconType="alert"
          iconColor="danger"
          title={<h2>Error from response</h2>}
          body={chatStateContext.chatState.llmError.message}
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
  if (props.message.type !== 'output' || !props.message.suggestedActions) return null;
  return (
    <>
      {props.message.suggestedActions.map((suggestedAction, i) => (
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
