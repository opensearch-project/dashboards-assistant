/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';
import React from 'react';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { FeedbackModal } from '../../../components/feedback_modal';
import { useChatContext } from '../../../contexts/chat_context';
import { useCore } from '../../../contexts/core_context';
import { AgentFrameworkTracesFlyoutBody } from '../../../components/agent_framework_traces_flyout_body';

interface MessageFooterProps {
  message: IMessage;
  previousInput?: IMessage;
}

export const MessageFooter: React.FC<MessageFooterProps> = React.memo((props) => {
  const chatContext = useChatContext();
  const core = useCore();
  const footers: React.ReactNode[] = [];

  if (props.message.type === 'output') {
    const traceId = props.message.traceId;
    if (traceId !== undefined) {
      footers.push(
        <EuiButtonEmpty
          iconType="iInCircle"
          iconSide="right"
          size="xs"
          flush="left"
          onClick={() => {
            chatContext.setFlyoutComponent(<AgentFrameworkTracesFlyoutBody />);
          }}
        >
          How was this generated?
        </EuiButtonEmpty>
      );
    }

    if (props.message.contentType === 'markdown' || props.message.contentType === 'error') {
      footers.push(
        <EuiButtonEmpty
          iconType="faceHappy"
          iconSide="right"
          size="xs"
          flush="left"
          onClick={() => {
            const modal = core.overlays.openModal(
              <FeedbackModal
                input={props.previousInput?.content}
                output={props.message.content}
                metadata={{
                  type: 'chat',
                  conversationId: chatContext.conversationId,
                  traceId,
                  error: props.message.contentType === 'error',
                }}
                onClose={() => modal.close()}
              />
            );
          }}
        >
          Feedback
        </EuiButtonEmpty>
      );
    }
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
