/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';
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
        <EuiButtonEmpty
          iconType="iInCircle"
          iconSide="right"
          size="xs"
          flush="left"
          onClick={() => {
            chatContext.setFlyoutComponent(
              <LangchainTracesFlyoutBody
                closeFlyout={() => chatContext.setFlyoutComponent(null)}
                sessionId={sessionId}
              />
            );
          }}
        >
          How was this generated?
        </EuiButtonEmpty>
      );
    }

    footers.push(
      <EuiButtonEmpty
        iconType="faceHappy"
        iconSide="right"
        size="xs"
        flush="left"
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
      >
        Feedback
      </EuiButtonEmpty>
    );
  }

  if (!footers.length) return null;

  return (
    <>
      <EuiHorizontalRule margin="s" />
      <EuiFlexGroup
        gutterSize="none"
        direction="column"
        justifyContent="spaceBetween"
        alignItems="flexStart"
      >
        {footers.map((footer, i) => (
          <EuiFlexItem key={i} grow={false}>
            {footer}
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </>
  );
});
