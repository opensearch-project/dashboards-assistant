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
import { Traces } from './traces';

export const TracesFlyoutBody: React.FC = () => {
  const chatContext = useChatContext();
  const traceId = chatContext.traceId;
  if (!traceId) {
    return null;
  }

  // docked right or fullscreen with history open
  const showBack = !chatContext.flyoutFullScreen || chatContext.preSelectedTabId === 'history';

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
                    chatContext.setSelectedTabId(chatContext.flyoutFullScreen ? 'history' : 'chat');
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
                    chatContext.setSelectedTabId('chat');
                  }}
                />
              )}
            </EuiPageHeaderSection>
          </EuiPageHeader>
          <EuiPageContentBody>
            <Traces traceId={traceId} />
          </EuiPageContentBody>
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
};
