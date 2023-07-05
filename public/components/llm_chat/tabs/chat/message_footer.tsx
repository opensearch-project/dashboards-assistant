/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import React, { useContext } from 'react';
import { toMountPoint } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { IMessage } from '../../../../../common/types/observability_saved_object_attributes';
import { ChatContext, CoreServicesContext } from '../../chat_header_button';
import { FeedbackModal } from '../../components/feedback_modal';
import { LangchainTracesFlyoutBody } from './langchain_traces_flyout_body';

interface MessageFooterProps {
  message: IMessage;
  previousInput?: IMessage;
}

export const MessageFooter: React.FC<MessageFooterProps> = React.memo((props) => {
  const chatContext = useContext(ChatContext)!;
  const coreServicesContext = useContext(CoreServicesContext)!;
  const footers: React.ReactNode[] = [];

  if (props.message.type === 'output') {
    const sessionId = props.message.sessionId;
    if (sessionId !== undefined) {
      footers.push(
        <EuiLink
          onClick={() => {
            chatContext.setFlyoutComponent(
              <LangchainTracesFlyoutBody
                closeFlyout={() => chatContext.setFlyoutComponent(null)}
                sessionId={sessionId}
              />
            );
          }}
        >
          <EuiText size="s">
            How was this generated? <EuiIcon type="iInCircle" />
          </EuiText>
        </EuiLink>
      );
    }

    footers.push(
      <EuiToolTip content="Feedback">
        <EuiButtonIcon
          aria-label="feedback-icon"
          iconType="faceHappy"
          onClick={() => {
            const modal = coreServicesContext.core.overlays.openModal(
              toMountPoint(
                <FeedbackModal
                  input={props.previousInput?.content}
                  output={props.message.content}
                  metadata={{
                    type: 'chat',
                    chatId: chatContext.chatId,
                    sessionId,
                    error: props.message.contentType === 'error',
                  }}
                  onClose={() => modal.close()}
                />
              )
            );
          }}
        />
      </EuiToolTip>
    );
  }

  if (!footers.length) return null;

  return (
    <>
      <EuiHorizontalRule margin="s" />
      <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
        {footers.map((footer, i) => (
          <EuiFlexItem key={i} grow={false}>
            {footer}
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </>
  );
});
