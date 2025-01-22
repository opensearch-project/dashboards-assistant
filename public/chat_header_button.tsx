/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiFieldText, EuiIcon, EuiButtonIcon } from '@elastic/eui';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEffectOnce, useObservable } from 'react-use';

import { ApplicationStart, HeaderVariant, SIDECAR_DOCKED_MODE } from '../../../src/core/public';
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
import { getLogoIcon } from './services';

interface HeaderChatButtonProps {
  application: ApplicationStart;
  messageRenderers: Record<string, MessageRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
  assistantActions: AssistantActions;
  currentAccount: UserAccount;
  inLegacyHeader?: boolean;
}

export const HeaderChatButton = (props: HeaderChatButtonProps) => {
  const core = useCore();
  const { inLegacyHeader } = props;
  const sideCarRef = useRef<{ close: Function }>();
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
  const flyoutLoadedRef = useRef(false);
  const flyoutVisibleRef = useRef(flyoutVisible);
  flyoutVisibleRef.current = flyoutVisible;
  const registry = getIncontextInsightRegistry();
  const headerVariant = useObservable(core.services.chrome.getHeaderVariant$());
  const isSingleLineHeader = headerVariant === HeaderVariant.APPLICATION;

  const [sidecarDockedMode, setSidecarDockedMode] = useState(DEFAULT_SIDECAR_DOCKED_MODE);
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
    if (!flyoutLoadedRef.current && flyoutVisible) {
      const mountPoint = flyoutMountPoint.current;
      if (mountPoint) {
        sideCarRef.current = core.overlays.sidecar().open(mountPoint, {
          className: 'chatbot-sidecar',
          config: {
            dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
            paddingSize: DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
            isHidden: false,
          },
        });
        flyoutLoadedRef.current = true;
      }
    } else if (flyoutLoadedRef.current && flyoutVisible) {
      core.overlays.sidecar().show();
    } else if (flyoutLoadedRef.current && !flyoutVisible) {
      core.overlays.sidecar().hide();
    }
  }, [flyoutVisible]);

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
    return () => {
      if (flyoutVisibleRef.current) {
        core.overlays.sidecar().hide();
      }
      sideCarRef.current?.close();
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

  useEffect(() => {
    const handleChatContinuation = (event: {
      conversationId?: string;
      contextContent: string;
      datasourceId?: string;
    }) => {
      if (!flyoutVisible) {
        // open chat window
        setFlyoutVisible(true);
      }
      // continue chat with current conversationId
      props.assistantActions.loadChat(event.conversationId);
    };
    registry.on('onChatContinuation', handleChatContinuation);
    return () => {
      registry.off('onChatContinuation', handleChatContinuation);
    };
  }, [appId, flyoutVisible, props.assistantActions, registry]);

  return (
    <>
      {!inLegacyHeader && isSingleLineHeader && (
        <EuiButtonIcon
          className={classNames(['eui-hideFor--xl', 'eui-hideFor--xxl', 'eui-hideFor--xxxl'])}
          iconType={getLogoIcon('gray')}
          onClick={() => setFlyoutVisible(!flyoutVisible)}
          display="base"
          size="s"
          aria-label="toggle chat flyout button icon"
        />
      )}
      <div
        className={classNames({
          'llm-chat-header-icon-wrapper': true,
          'eui-hideFor--l': isSingleLineHeader,
          'eui-hideFor--m': isSingleLineHeader,
          'eui-hideFor--s': isSingleLineHeader,
          'eui-hideFor--xs': isSingleLineHeader,
          'in-legacy-header': inLegacyHeader,
        })}
      >
        <EuiFieldText
          aria-label="chat input"
          inputRef={inputRef}
          compressed
          onFocus={() => setInputFocus(true)}
          onBlur={() => setInputFocus(false)}
          placeholder="Ask a question"
          onKeyPress={onKeyPress}
          onKeyUp={onKeyUp}
          className="llm-chat-header-text-input"
        />
        <EuiIcon
          aria-label="toggle chat flyout icon"
          type={getLogoIcon('gray')}
          size="m"
          onClick={() => setFlyoutVisible(!flyoutVisible)}
          className="llm-chat-toggle-icon"
        />
        <span className="llm-chat-header-shortcut">
          {inputFocus ? (
            <EuiBadge
              color="hollow"
              title="press enter to chat"
              className="llm-chat-header-shortcut-enter"
            >
              ⏎
            </EuiBadge>
          ) : (
            <EuiBadge
              color="hollow"
              title="press Ctrl + / to start typing"
              className="llm-chat-header-shortcut-cmd"
            >
              Ctrl + /
            </EuiBadge>
          )}
        </span>
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
