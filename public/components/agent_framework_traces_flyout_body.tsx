/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiFlyoutBody,
  EuiPage,
  EuiPageBody,
  EuiPageContentBody,
  EuiPageHeader,
  EuiButtonIcon,
  EuiPageHeaderSection,
} from '@elastic/eui';
import React from 'react';
import { useChatContext } from '../contexts/chat_context';
import { AgentFrameworkTraces } from './agent_framework_traces';
import { TAB_ID } from '../utils/constants';

export const AgentFrameworkTracesFlyoutBody: React.FC = () => {
  const chatContext = useChatContext();
  const traceId = chatContext.traceId;
  if (!traceId) {
    return null;
  }

  // docked right or fullscreen with history open
  const showBack = !chatContext.flyoutFullScreen || chatContext.preSelectedTabId === TAB_ID.HISTORY;

  return (
    <EuiFlyoutBody className="llm-chat-flyout llm-chat-flyout-body">
      <EuiPage>
        <EuiPageBody>
          <EuiPageHeader>
            <EuiPageHeaderSection>
              {showBack && (
                <EuiButtonEmpty
                  size="xs"
                  flush="left"
                  onClick={() => {
                    chatContext.setSelectedTabId(
                      chatContext.flyoutFullScreen ? TAB_ID.HISTORY : TAB_ID.CHAT
                    );
                  }}
                  iconType="arrowLeft"
                >
                  Back
                </EuiButtonEmpty>
              )}
            </EuiPageHeaderSection>
            <EuiPageHeaderSection>
              {!showBack && (
                <EuiButtonIcon
                  aria-label="close"
                  size="xs"
                  color="text"
                  iconType="cross"
                  onClick={() => {
                    chatContext.setSelectedTabId(TAB_ID.CHAT);
                  }}
                />
              )}
            </EuiPageHeaderSection>
          </EuiPageHeader>
          <EuiPageContentBody>
            <AgentFrameworkTraces traceId={traceId} />
          </EuiPageContentBody>
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
};
