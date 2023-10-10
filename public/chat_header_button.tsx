/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout, EuiHeaderSectionItemButton, EuiIcon } from '@elastic/eui';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { ApplicationStart } from '../../../src/core/public';
import chatIcon from './assets/chat.svg';
import { ChatFlyout } from './chat_flyout';
import { ChatContext, IChatContext } from './contexts/chat_context';
import { SetContext } from './contexts/set_context';
import { ChatStateProvider } from './hooks/use_chat_state';
import './index.scss';
import { TabId } from './tabs/chat_tab_bar';
import { ActionExecutor, AssistantActions, ContentRenderer } from './types';

interface HeaderChatButtonProps {
  application: ApplicationStart;
  chatEnabled: boolean;
  contentRenderers: Record<string, ContentRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
  assistantActions: AssistantActions;
}

let flyoutLoaded = false;

export const HeaderChatButton: React.FC<HeaderChatButtonProps> = (props) => {
  const [appId, setAppId] = useState<string>();
  const [chatId, setChatId] = useState<string>();
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [flyoutComponent, setFlyoutComponent] = useState<React.ReactNode | null>(null);
  const [flyoutProps, setFlyoutProps] = useState<Partial<React.ComponentProps<typeof EuiFlyout>>>(
    {}
  );
  const [selectedTabId, setSelectedTabId] = useState<TabId>('chat');

  if (!flyoutLoaded && flyoutVisible) flyoutLoaded = true;

  useEffectOnce(() => {
    const subscription = props.application.currentAppId$.subscribe((id) => setAppId(id));
    return () => subscription.unsubscribe();
  });

  const toggleFlyoutFullScreen = useCallback(() => {
    setFlyoutProps((fprops) => (Object.keys(fprops).length ? {} : { size: '100%' }));
  }, []);

  const chatContextValue: IChatContext = useMemo(
    () => ({
      appId,
      chatId,
      setChatId,
      selectedTabId,
      setSelectedTabId,
      flyoutVisible,
      setFlyoutVisible,
      setFlyoutComponent,
      chatEnabled: props.chatEnabled,
      contentRenderers: props.contentRenderers,
      actionExecutors: props.actionExecutors,
    }),
    [
      appId,
      chatId,
      flyoutVisible,
      selectedTabId,
      props.chatEnabled,
      props.contentRenderers,
      props.actionExecutors,
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
        <EuiIcon type={chatIcon} size="l" />
      </EuiHeaderSectionItemButton>
      <ChatContext.Provider value={chatContextValue}>
        <ChatStateProvider>
          <SetContext assistantActions={props.assistantActions} />
          {flyoutLoaded ? (
            <ChatFlyout
              flyoutVisible={flyoutVisible}
              overrideComponent={flyoutComponent}
              flyoutProps={flyoutProps}
              flyoutFullScreen={!!Object.keys(flyoutProps).length}
              toggleFlyoutFullScreen={toggleFlyoutFullScreen}
            />
          ) : null}
        </ChatStateProvider>
      </ChatContext.Provider>
    </>
  );
};
