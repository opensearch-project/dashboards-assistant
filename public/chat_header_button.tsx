/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEffectOnce, useObservable, useUpdateEffect } from 'react-use';
import { debounceTime } from 'rxjs/operators';

import {
  ApplicationStart,
  HeaderVariant,
  MountPoint,
  SIDECAR_DOCKED_MODE,
} from '../../../src/core/public';
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
import {
  getChatbotOpenStatus,
  getChatbotState,
  setChatbotOpenStatus,
  setChatbotSidecarConfig,
} from './utils/persisted_chatbot_state';

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
  const sideCarRef = useRef<{ close: Function }>();
  const [appId, setAppId] = useState<string>();
  const [conversationId, setConversationId] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [flyoutVisible, setFlyoutVisible] = useState(() => getChatbotOpenStatus());
  const [flyoutComponent, setFlyoutComponent] = useState<React.ReactNode | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<TabId>(TAB_ID.CHAT);
  const [preSelectedTabId, setPreSelectedTabId] = useState<TabId | undefined>(undefined);
  const [interactionId, setInteractionId] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const flyoutVisibleRef = useRef(flyoutVisible);
  flyoutVisibleRef.current = flyoutVisible;
  const registry = getIncontextInsightRegistry();
  const headerVariant = useObservable(core.services.chrome.getHeaderVariant$());
  const isSingleLineHeader = headerVariant === HeaderVariant.APPLICATION;

  const [sidecarDockedMode, setSidecarDockedMode] = useState(
    () => getChatbotState()?.sidecarConfig?.dockedMode || DEFAULT_SIDECAR_DOCKED_MODE
  );
  const flyoutFullScreen = sidecarDockedMode === SIDECAR_DOCKED_MODE.TAKEOVER;
  const flyoutMountPoint = useRef(null);
  usePatchFixedStyle();

  const loadLatestConversation = () => {
    core.services.conversationLoad.getLatestConversationId().then((latestConversationId) => {
      if (latestConversationId) {
        props.assistantActions.loadChat(latestConversationId);
      }
    });
  };

  const openSidecar = useCallback(
    (mountPoint: MountPoint) => {
      sideCarRef.current = core.overlays.sidecar().open(mountPoint, {
        className: 'chatbot-sidecar',
        config: {
          dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
          paddingSize: DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
          ...getChatbotState()?.sidecarConfig,
          isHidden: false,
        },
      });
    },
    [core.overlays]
  );

  useEffectOnce(() => {
    const subscription = props.application.currentAppId$.subscribe((id) => setAppId(id));
    const sidecarConfig$Subscription = core.overlays
      .sidecar()
      .getSidecarConfig$()
      .pipe(debounceTime(30))
      .subscribe((newSidecarConfig) => {
        if (newSidecarConfig) {
          setChatbotSidecarConfig(newSidecarConfig);
        }
      });
    let rafId: number;
    if (flyoutVisible) {
      // Add window.requestAnimationFrame here to avoid chatbot flyout not displayed after page switching
      rafId = window.requestAnimationFrame(() => {
        if (flyoutMountPoint.current) {
          loadLatestConversation();
          openSidecar(flyoutMountPoint.current);
        }
      });
    }
    return () => {
      window.cancelAnimationFrame(rafId);
      subscription.unsubscribe();
      sidecarConfig$Subscription.unsubscribe();
    };
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

  useUpdateEffect(() => {
    if (flyoutVisible) {
      const mountPoint = flyoutMountPoint.current;
      if (sideCarRef.current) {
        core.overlays.sidecar().show();
      } else if (mountPoint) {
        openSidecar(mountPoint);
      }
    } else if (sideCarRef.current) {
      core.overlays.sidecar().hide();
    }
    setChatbotOpenStatus(flyoutVisible);
  }, [flyoutVisible, openSidecar]);

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
  }, [core.overlays]);

  useEffect(() => {
    const handleSuggestion = async (event: {
      suggestion: string;
      contextContent: string;
      datasourceId?: string;
    }) => {
      if (!flyoutVisible) {
        // open chat window
        setFlyoutVisible(true);
      }
      // start a new chat
      await props.assistantActions.loadChat();
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

  const toggleFlyoutAndLoadLatestConversation = () => {
    setFlyoutVisible(!flyoutVisible);
    if (flyoutVisible) {
      return;
    }
    loadLatestConversation();
  };

  return (
    <>
      <EuiToolTip content={'ChatBot'}>
        <EuiButtonIcon
          className={'llm-chat-header-text-input'}
          iconType={getLogoIcon('gradient')}
          onClick={toggleFlyoutAndLoadLatestConversation}
          display={isSingleLineHeader ? 'base' : 'empty'}
          size="s"
          aria-label="toggle chat flyout icon"
        />
      </EuiToolTip>
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
    </>
  );
};
