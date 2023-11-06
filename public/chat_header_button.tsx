/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHeaderSectionItemButton, EuiIcon } from '@elastic/eui';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { ApplicationStart } from '../../../src/core/public';
import { ChatFlyout } from './chat_flyout';
import { ChatContext, IChatContext } from './contexts/chat_context';
import { SetContext } from './contexts/set_context';
import { ChatStateProvider } from './hooks/use_chat_state';
import './index.scss';
import { ActionExecutor, AssistantActions, ContentRenderer, UserAccount, TabId } from './types';

interface HeaderChatButtonProps {
  application: ApplicationStart;
  chatEnabled: boolean;
  contentRenderers: Record<string, ContentRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
  assistantActions: AssistantActions;
  currentAccount: UserAccount;
}

let flyoutLoaded = false;

export const HeaderChatButton: React.FC<HeaderChatButtonProps> = (props) => {
  const [appId, setAppId] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [flyoutComponent, setFlyoutComponent] = useState<React.ReactNode | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<TabId>('chat');
  const [chatSize, setChatSize] = useState<number | 'fullscreen' | 'dock-right'>('dock-right');

  if (!flyoutLoaded && flyoutVisible) flyoutLoaded = true;

  useEffectOnce(() => {
    const subscription = props.application.currentAppId$.subscribe((id) => setAppId(id));
    return () => subscription.unsubscribe();
  });

  const toggleFlyoutFullScreen = useCallback(() => {
    if (chatSize === 'fullscreen') {
      setChatSize('dock-right');
    } else if (chatSize === 'dock-right') {
      setChatSize('fullscreen');
    }
  }, [chatSize, setChatSize]);

  const chatContextValue: IChatContext = useMemo(
    () => ({
      appId,
      sessionId,
      setSessionId,
      selectedTabId,
      setSelectedTabId,
      flyoutVisible,
      setFlyoutVisible,
      setFlyoutComponent,
      chatEnabled: props.chatEnabled,
      contentRenderers: props.contentRenderers,
      actionExecutors: props.actionExecutors,
      currentAccount: props.currentAccount,
      title,
      setTitle,
    }),
    [
      appId,
      sessionId,
      flyoutVisible,
      selectedTabId,
      props.chatEnabled,
      props.contentRenderers,
      props.actionExecutors,
      props.currentAccount,
      title,
      setTitle,
    ]
  );

  return (
    <>
      <EuiHeaderSectionItemButton
        className={classNames('llm-chat-header-icon-wrapper', {
          'llm-chat-header-icon-wrapper-selected': flyoutVisible,
        })}
        onClick={() => setFlyoutVisible(!flyoutVisible)}
      >
        <EuiIcon type="chatRight" size="m" />
      </EuiHeaderSectionItemButton>
      <ChatContext.Provider value={chatContextValue}>
        <ChatStateProvider>
          <SetContext assistantActions={props.assistantActions} />
          {flyoutLoaded ? (
            <ChatFlyout
              flyoutVisible={flyoutVisible}
              overrideComponent={flyoutComponent}
              flyoutProps={chatSize === 'fullscreen' ? { size: '100%' } : {}}
              flyoutFullScreen={chatSize === 'fullscreen'}
              toggleFlyoutFullScreen={toggleFlyoutFullScreen}
            />
          ) : null}
        </ChatStateProvider>
      </ChatContext.Provider>
    </>
  );
};
