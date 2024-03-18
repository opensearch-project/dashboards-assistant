/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiResizableContainer } from '@elastic/eui';
import cs from 'classnames';
import React, { useRef } from 'react';
import { useChatContext } from './contexts/chat_context';
import { ChatPage } from './tabs/chat/chat_page';
import { ChatWindowHeader } from './tabs/chat_window_header';
import { ChatHistoryPage } from './tabs/history/chat_history_page';
import { AgentFrameworkTracesFlyoutBody } from './components/agent_framework_traces_flyout_body';
import { TAB_ID } from './utils/constants';

interface ChatFlyoutProps {
  flyoutVisible: boolean;
  overrideComponent: React.ReactNode | null;
  flyoutFullScreen: boolean;
}

export const ChatFlyout = (props: ChatFlyoutProps) => {
  const chatContext = useChatContext();
  const chatHistoryPageLoadedRef = useRef(false);

  let chatPageVisible = false;
  let chatHistoryPageVisible = false;
  let chatTraceVisible = false;

  if (!props.overrideComponent) {
    switch (chatContext.selectedTabId) {
      case TAB_ID.CHAT:
        chatPageVisible = true;
        break;

      case TAB_ID.HISTORY:
        chatHistoryPageVisible = true;
        break;

      case TAB_ID.TRACE:
        chatTraceVisible = true;
        break;

      default:
        break;
    }
  }

  // Always show chat page in fullscreen mode
  if (!props.overrideComponent && props.flyoutFullScreen) {
    chatPageVisible = true;
  }

  if (!chatHistoryPageLoadedRef.current && chatHistoryPageVisible)
    chatHistoryPageLoadedRef.current = true;

  const resizable = props.flyoutFullScreen && (chatHistoryPageVisible || chatTraceVisible);
  const getLeftPanelSize = () => {
    if (resizable) {
      return undefined;
    }
    if (chatPageVisible) {
      return 100;
    }
    return 0;
  };

  const getRightPanelSize = () => {
    if (resizable) {
      return undefined;
    }
    if (chatHistoryPageVisible || chatTraceVisible) {
      return 100;
    }
    return 0;
  };

  const leftPanelSize = getLeftPanelSize();
  const rightPanelSize = getRightPanelSize();

  return (
    <div
      className={cs('llm-chat-flyout', {
        'llm-chat-fullscreen': props.flyoutFullScreen,
      })}
    >
      <>
        <div className={cs('llm-chat-flyout-header')}>
          <ChatWindowHeader />
        </div>

        {props.overrideComponent}
        <EuiResizableContainer style={{ height: '100%', overflow: 'hidden' }}>
          {(Panel, Resizer) => (
            <>
              <Panel
                aria-label="chat panel"
                className={cs('llm-chat-horizontal-resize-panel', {
                  'llm-chat-hidden': leftPanelSize === 0,
                })}
                scrollable={false}
                size={leftPanelSize}
                initialSize={resizable ? 70 : undefined}
                paddingSize="none"
              >
                <ChatPage />
              </Panel>
              <>
                {resizable && <Resizer />}
                <Panel
                  aria-label="history panel"
                  className={cs('llm-chat-horizontal-resize-panel', {
                    'llm-chat-hidden': leftPanelSize === 100,
                  })}
                  scrollable={false}
                  size={rightPanelSize}
                  initialSize={resizable ? 30 : undefined}
                  paddingSize="none"
                >
                  {chatHistoryPageLoadedRef.current && (
                    <ChatHistoryPage
                      // refresh data when user switched to table from another tab
                      shouldRefresh={chatHistoryPageVisible}
                      className={cs({ 'llm-chat-hidden': !chatHistoryPageVisible })}
                    />
                  )}
                  {chatTraceVisible && chatContext.interactionId && (
                    <AgentFrameworkTracesFlyoutBody />
                  )}
                </Panel>
              </>
            </>
          )}
        </EuiResizableContainer>
      </>
    </div>
  );
};
