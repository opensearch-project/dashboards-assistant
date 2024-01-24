/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiFieldText, EuiIcon } from '@elastic/eui';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { ApplicationStart } from '../../../src/core/public';
import chatIcon from './assets/chat.svg';
import { ChatFlyout } from './chat_flyout';
import { ChatContext, IChatContext } from './contexts/chat_context';
import { SetContext } from './contexts/set_context';
import { ChatStateProvider } from './hooks';
import './index.scss';
import { ActionExecutor, AssistantActions, MessageRenderer, TabId, UserAccount } from './types';
import { TAB_ID } from './utils/constants';

interface HeaderChatButtonProps {
  application: ApplicationStart;
  userHasAccess: boolean;
  messageRenderers: Record<string, MessageRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
  assistantActions: AssistantActions;
  currentAccount: UserAccount;
}

let flyoutLoaded = false;

export const HeaderChatButton = (props: HeaderChatButtonProps) => {
  const [appId, setAppId] = useState<string>();
  const [conversationId, setConversationId] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [flyoutComponent, setFlyoutComponent] = useState<React.ReactNode | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<TabId>(TAB_ID.CHAT);
  const [preSelectedTabId, setPreSelectedTabId] = useState<TabId | undefined>(undefined);
  const [interactionId, setInteractionId] = useState<string | undefined>(undefined);
  const [chatSize, setChatSize] = useState<number | 'fullscreen' | 'dock-right'>('dock-right');
  const [inputFocus, setInputFocus] = useState(false);
  const flyoutFullScreen = chatSize === 'fullscreen';
  const inputRef = useRef<HTMLInputElement>(null);

  if (!flyoutLoaded && flyoutVisible) flyoutLoaded = true;

  useEffectOnce(() => {
    const subscription = props.application.currentAppId$.subscribe((id) => setAppId(id));
    return () => subscription.unsubscribe();
  });

  const toggleFlyoutFullScreen = useCallback(() => {
    setChatSize(flyoutFullScreen ? 'dock-right' : 'fullscreen');
  }, [flyoutFullScreen, setChatSize]);

  const chatContextValue: IChatContext = useMemo(
    () => ({
      appId,
      conversationId,
      setConversationId,
      selectedTabId,
      preSelectedTabId,
      setSelectedTabId: (tabId: TabId) => {
        setPreSelectedTabId(selectedTabId);
        setSelectedTabId(tabId);
      },
      flyoutVisible,
      flyoutFullScreen,
      setFlyoutVisible,
      setFlyoutComponent,
      userHasAccess: props.userHasAccess,
      messageRenderers: props.messageRenderers,
      actionExecutors: props.actionExecutors,
      currentAccount: props.currentAccount,
      title,
      setTitle,
      interactionId,
      setInteractionId,
    }),
    [
      appId,
      conversationId,
      flyoutVisible,
      flyoutFullScreen,
      selectedTabId,
      preSelectedTabId,
      props.userHasAccess,
      props.messageRenderers,
      props.actionExecutors,
      props.currentAccount,
      title,
      setTitle,
      interactionId,
      setInteractionId,
    ]
  );

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputRef.current && inputRef.current.value.trim().length > 0) {
      // open chat window
      setFlyoutVisible(true);
      // start a new chat
      props.assistantActions.loadChat();
      // send message
      props.assistantActions.send({
        type: 'input',
        contentType: 'text',
        content: inputRef.current.value,
        context: { appId },
      });
      // reset query to empty
      inputRef.current.value = '';
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (!props.userHasAccess) {
      return;
    }
    const onGlobalMouseUp = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onGlobalMouseUp);

    return () => {
      document.removeEventListener('keydown', onGlobalMouseUp);
    };
  }, [props.userHasAccess]);

  return (
    <>
      <div className={classNames('llm-chat-header-icon-wrapper')}>
        <EuiFieldText
          aria-label="chat input"
          inputRef={inputRef}
          compressed
          onFocus={() => setInputFocus(true)}
          onBlur={() => setInputFocus(false)}
          placeholder="Ask question"
          onKeyPress={onKeyPress}
          onKeyUp={onKeyUp}
          prepend={
            <EuiIcon
              aria-label="toggle chat flyout icon"
              type={chatIcon}
              size="l"
              onClick={() => setFlyoutVisible(!flyoutVisible)}
            />
          }
          append={
            <span className="llm-chat-header-shortcut">
              {inputFocus ? (
                <EuiBadge
                  title="press enter to chat"
                  className="llm-chat-header-shortcut-enter"
                  color="hollow"
                >
                  ⏎
                </EuiBadge>
              ) : (
                <EuiBadge
                  title="press Ctrl + / to start typing"
                  className="llm-chat-header-shortcut-cmd"
                  color="hollow"
                >
                  Ctrl + /
                </EuiBadge>
              )}
            </span>
          }
          disabled={!props.userHasAccess}
        />
      </div>
      <ChatContext.Provider value={chatContextValue}>
        <ChatStateProvider>
          <SetContext assistantActions={props.assistantActions} />
          {flyoutLoaded ? (
            <ChatFlyout
              flyoutVisible={flyoutVisible}
              overrideComponent={flyoutComponent}
              flyoutProps={flyoutFullScreen ? { size: '100%' } : {}}
              flyoutFullScreen={flyoutFullScreen}
              toggleFlyoutFullScreen={toggleFlyoutFullScreen}
            />
          ) : null}
        </ChatStateProvider>
      </ChatContext.Provider>
    </>
  );
};
