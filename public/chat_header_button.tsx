/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiFieldText, EuiIcon } from '@elastic/eui';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEffectOnce } from 'react-use';

import { ApplicationStart, SIDECAR_DOCKED_MODE } from '../../../src/core/public';
// TODO: Replace with getChrome().logos.Chat.url
import chatIcon from './assets/chat.svg';
import { getIncontextInsightRegistry } from './services';
import { ChatFlyout } from './chat_flyout';
import { ChatContext, IChatContext } from './contexts/chat_context';
import { SetContext } from './contexts/set_context';
import { ChatStateProvider } from './hooks';
import './index.scss';
import { ActionExecutor, AssistantActions, MessageRenderer, TabId, UserAccount } from './types';
import {
  TAB_ID,
  DEFAULT_SIDECAR_DOCKED_MODE,
  DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
} from './utils/constants';
import { useCore } from './contexts/core_context';
import { MountPointPortal } from '../../../src/plugins/opensearch_dashboards_react/public';
import { usePatchFixedStyle } from './hooks/use_patch_fixed_style';

interface HeaderChatButtonProps {
  application: ApplicationStart;
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
  const [inputFocus, setInputFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const registry = getIncontextInsightRegistry();

  const [sidecarDockedMode, setSidecarDockedMode] = useState(DEFAULT_SIDECAR_DOCKED_MODE);
  const core = useCore();
  const flyoutFullScreen = sidecarDockedMode === SIDECAR_DOCKED_MODE.TAKEOVER;
  const flyoutMountPoint = useRef(null);
  usePatchFixedStyle();

  useEffectOnce(() => {
    const subscription = props.application.currentAppId$.subscribe((id) => setAppId(id));
    return () => subscription.unsubscribe();
  });

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
      messageRenderers: props.messageRenderers,
      actionExecutors: props.actionExecutors,
      currentAccount: props.currentAccount,
      title,
      setTitle,
      interactionId,
      setInteractionId,
      sidecarDockedMode,
      setSidecarDockedMode,
    }),
    [
      appId,
      conversationId,
      flyoutVisible,
      flyoutFullScreen,
      selectedTabId,
      preSelectedTabId,
      props.messageRenderers,
      props.actionExecutors,
      props.currentAccount,
      title,
      setTitle,
      interactionId,
      setInteractionId,
      sidecarDockedMode,
      setSidecarDockedMode,
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

  useEffect(() => {
    if (!flyoutLoaded && flyoutVisible) {
      const mountPoint = flyoutMountPoint.current;
      if (mountPoint) {
        core.overlays.sidecar().open(mountPoint, {
          className: 'chatbot-sidecar',
          config: {
            dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
            paddingSize: DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
          },
        });
        flyoutLoaded = true;
      }
    } else if (flyoutLoaded && flyoutVisible) {
      core.overlays.sidecar().show();
    } else if (flyoutLoaded && !flyoutVisible) {
      core.overlays.sidecar().hide();
    }
  }, [flyoutVisible, flyoutLoaded]);

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const setMountPoint = useCallback((mountPoint) => {
    flyoutMountPoint.current = mountPoint;
  }, []);

  useEffect(() => {
    const onGlobalMouseUp = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onGlobalMouseUp);

    return () => {
      document.removeEventListener('keydown', onGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleSuggestion = (event: {
      suggestion: string;
      contextContent: string;
      datasourceId?: string;
    }) => {
      if (!flyoutVisible) {
        // open chat window
        setFlyoutVisible(true);
      }
      // start a new chat
      props.assistantActions.loadChat();
      // send message
      props.assistantActions.send({
        type: 'input',
        contentType: 'text',
        content: event.suggestion,
        context: { appId, content: event.contextContent, datasourceId: event.datasourceId },
      });
    };
    registry.on('onSuggestion', handleSuggestion);
    return () => {
      registry.off('onSuggestion', handleSuggestion);
    };
  }, [appId, flyoutVisible, props.assistantActions, registry]);

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
        />
        <ChatContext.Provider value={chatContextValue}>
          <ChatStateProvider>
            <SetContext assistantActions={props.assistantActions} />
            {/* Chatbot's DOM consists of two parts. One part is the headerButton inside the OSD, and the other part is the flyout/sidecar outside the OSD. This is to allow the context of the two parts to be shared. */}
            <MountPointPortal setMountPoint={setMountPoint}>
              <ChatFlyout
                flyoutVisible={flyoutVisible}
                overrideComponent={flyoutComponent}
                flyoutFullScreen={flyoutFullScreen}
              />
            </MountPointPortal>
          </ChatStateProvider>
        </ChatContext.Provider>
      </div>
    </>
  );
};
