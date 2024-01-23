/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiFieldText, EuiIcon } from '@elastic/eui';
import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useEffectOnce, useObservable } from 'react-use';
import { ApplicationStart } from '../../../src/core/public';
// TODO: Replace with getChrome().logos.Chat.url
import chatIcon from './assets/chat.svg';
import { getIncontextInsightRegistry } from './services';
import { ChatFlyout } from './chat_flyout';
import { ChatContext, IChatContext } from './contexts/chat_context';
import { SetContext } from './contexts/set_context';
import { ChatStateProvider } from './hooks';
import './index.scss';
import { ActionExecutor, AssistantActions, MessageRenderer, TabId, UserAccount } from './types';
import { TAB_ID } from './utils/constants';
import { useCore } from './contexts/core_context';
import {
  toMountPoint,
  MountPointPortal,
} from '../../../src/plugins/opensearch_dashboards_react/public';
import { OpenSearchDashboardsReactContext } from '../../../src/plugins/opensearch_dashboards_react/public';
import { AssistantServices } from './contexts/core_context';
import { ISidecarConfig } from '../../../src/core/public';

interface HeaderChatButtonProps {
  application: ApplicationStart;
  userHasAccess: boolean;
  messageRenderers: Record<string, MessageRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
  assistantActions: AssistantActions;
  currentAccount: UserAccount;
  coreContext: OpenSearchDashboardsReactContext<AssistantServices>;
}

let flyoutLoaded = false;

export const HeaderChatButton = React.memo((props: HeaderChatButtonProps) => {
  const [appId, setAppId] = useState<string>();
  const [conversationId, setConversationId] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [flyoutComponent, setFlyoutComponent] = useState<React.ReactNode | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<TabId>(TAB_ID.CHAT);
  const [preSelectedTabId, setPreSelectedTabId] = useState<TabId | undefined>(undefined);
  const [interactionId, setInteractionId] = useState<string | undefined>(undefined);
  const [chatSize, setChatSize] = useState<number | 'fullscreen' | 'dock-right'>('dock-right');
  const [dockedDirection, setDockedDirection] = useState<ISidecarConfig['dockedDirection']>(
    'right'
  );
  const [query, setQuery] = useState('');
  const [inputFocus, setInputFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const registry = getIncontextInsightRegistry();

  if (!flyoutLoaded && flyoutVisible) flyoutLoaded = true;
  // const [flyoutLoaded, setFlyoutLoaded] = useState(false);
  const core = useCore();
  // if (!flyoutLoaded && flyoutVisible) flyoutLoaded = true;
  const sidecarConfig = useObservable(core.overlays.sidecar().getSidecarConfig$());
  const flyoutFullScreen = sidecarConfig?.dockedMode === 'takeover';
  const flyoutMountPoint = useRef(null);

  useEffectOnce(() => {
    const subscription = props.application.currentAppId$.subscribe((id) => setAppId(id));
    return () => subscription.unsubscribe();
  });

  const toggleFlyoutFullScreen = useCallback(
    (direction: ISidecarConfig['dockedMode']) => {
      setDockedDirection((prevDirection) => {
        if (prevDirection === direction) {
          return prevDirection;
        } else {
          if (direction === 'bottom') {
            core.overlays.sidecar().setSidecarConfig({
              dockedMode: 'bottom',
              paddingSize: window.innerHeight - 136,
            });
          } else {
            core.overlays.sidecar().setSidecarConfig({
              dockedMode: direction,
              paddingSize: 460,
            });
          }
          return direction;
        }
      });
    },
    [flyoutFullScreen]
  );

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

  // const mountPoint = toMountPoint(
  // <ChatFlyout
  //   flyoutVisible={flyoutVisible}
  //   overrideComponent={flyoutComponent}
  //   flyoutFullScreen={flyoutFullScreen}
  // />
  // );

  useEffect(() => {
    if (!flyoutLoaded && flyoutVisible) {
      const a = flyoutMountPoint.current;

      core.overlays.sidecar().open(a, {
        className: 'chatbot-sidecar',
        config: {
          dockedMode: 'right',
          paddingSize: 460,
        },
      });
      flyoutLoaded = true;
    } else if (flyoutLoaded && flyoutVisible) {
      core.overlays.sidecar().show();
    } else if (flyoutLoaded && !flyoutVisible) {
      core.overlays.sidecar().hide();
    }
  }, [flyoutVisible, flyoutLoaded, flyoutMountPoint]);

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const setMountPoint = useCallback((mountPoint) => {
    // setFlyoutMountPoint(() => mountPoint);
    flyoutMountPoint.current = mountPoint;
  }, []);
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

  useEffect(() => {
    const handleSuggestion = (event: { suggestion: string }) => {
      if (!flyoutVisible) {
        // open chat window
        setFlyoutVisible(true);
        // start a new chat
        props.assistantActions.loadChat();
      }
      // send message
      props.assistantActions.send({
        type: 'input',
        contentType: 'text',
        content: event.suggestion,
        context: { appId },
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
          disabled={!props.userHasAccess}
        />
        <props.coreContext.Provider>
          <ChatContext.Provider value={chatContextValue}>
            <ChatStateProvider>
              <SetContext assistantActions={props.assistantActions} />
              <MountPointPortal setMountPoint={setMountPoint}>
                <ChatFlyout
                  flyoutVisible={flyoutVisible}
                  overrideComponent={flyoutComponent}
                  flyoutFullScreen={flyoutFullScreen}
                />
                {/* <div>123</div> */}
              </MountPointPortal>
            </ChatStateProvider>
          </ChatContext.Provider>
        </props.coreContext.Provider>
      </div>
    </>
  );
});
