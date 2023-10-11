/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';
import React from 'react';
import { toMountPoint } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { FeedbackModal } from '../../../components/feedback_modal';
import { LangchainTracesFlyoutBody } from '../../../components/langchain_traces_flyout_body';
import { useChatContext } from '../../../contexts/chat_context';
import { useCore } from '../../../contexts/core_context';

interface MessageFooterProps {
  message: IMessage;
  previousInput?: IMessage;
}

export const MessageFooter: React.FC<MessageFooterProps> = React.memo((props) => {
  const chatContext = useChatContext();
  const core = useCore();
  const footers: React.ReactNode[] = [];

  if (props.message.type === 'output') {
    const traceID = props.message.traceID;
    if (traceID !== undefined) {
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
                traceID={traceID}
              />
            );
          }}
        >
          How was this generated?
        </EuiButtonEmpty>
      );
    }

    if (props.message.contentType === 'markdown') {
      footers.push(
        <EuiButtonEmpty
          iconType="faceHappy"
          iconSide="right"
          size="xs"
          flush="left"
          onClick={() => {
            const modal = core.overlays.openModal(
              toMountPoint(
                <FeedbackModal
                  input={props.previousInput?.content}
                  output={props.message.content}
                  metadata={{
                    type: 'chat',
                    sessionID: chatContext.sessionID,
                    traceID,
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
