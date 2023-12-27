/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiFieldText, EuiIcon } from '@elastic/eui';
import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { ApplicationStart } from '../../../src/core/public';
import { ChatFlyout } from './chat_flyout';
import { ChatContext, IChatContext } from './contexts/chat_context';
import { SetContext } from './contexts/set_context';
import { ChatStateProvider } from './hooks';
import './index.scss';
import chatIcon from './assets/chat.svg';
import { ActionExecutor, AssistantActions, ContentRenderer, UserAccount, TabId } from './types';
import { TAB_ID } from './utils/constants';

interface HeaderChatButtonProps {
  application: ApplicationStart;
  userHasAccess: boolean;
  contentRenderers: Record<string, ContentRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
  assistantActions: AssistantActions;
  currentAccount: UserAccount;
}

let flyoutLoaded = false;

export const HeaderChatButton = (props: HeaderChatButtonProps) => {
  const [appId, setAppId] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [flyoutComponent, setFlyoutComponent] = useState<React.ReactNode | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<TabId>(TAB_ID.CHAT);
  const [preSelectedTabId, setPreSelectedTabId] = useState<TabId | undefined>(undefined);
  const [traceId, setTraceId] = useState<string | undefined>(undefined);
  const [chatSize, setChatSize] = useState<number | 'fullscreen' | 'dock-right'>('dock-right');
  const [query, setQuery] = useState('');
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
      sessionId,
      setSessionId,
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
      contentRenderers: props.contentRenderers,
      actionExecutors: props.actionExecutors,
      currentAccount: props.currentAccount,
      title,
      setTitle,
      traceId,
      setTraceId,
    }),
    [
      appId,
      sessionId,
      flyoutVisible,
      flyoutFullScreen,
      selectedTabId,
      preSelectedTabId,
      props.userHasAccess,
      props.contentRenderers,
      props.actionExecutors,
      props.currentAccount,
      title,
      setTitle,
      traceId,
      setTraceId,
    ]
  );

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length > 0) {
      // open chat window
      setFlyoutVisible(true);
      // start a new chat
      props.assistantActions.loadChat();
      // send message
      props.assistantActions.send({
        type: 'input',
        contentType: 'text',
        content: query,
        context: { appId },
      });
      // reset query to empty
      setQuery('');
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
      if (e.metaKey && e.key === '/') {
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
          value={query}
          onFocus={() => setInputFocus(true)}
          onBlur={() => setInputFocus(false)}
          onChange={(e) => setQuery(e.target.value)}
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
                  title="press ⌘ + / to start typing"
                  className="llm-chat-header-shortcut-cmd"
                  color="hollow"
                >
                  ⌘ + /
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
