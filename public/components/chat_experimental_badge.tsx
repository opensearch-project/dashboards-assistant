/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiPopover,
  EuiSmallButtonIcon,
  EuiTitle,
  EuiHorizontalRule,
  EuiText,
  EuiLink,
} from '@elastic/eui';

interface ChatExperimentalBadgeProps {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const ChatExperimentalBadge = ({ onClick }: ChatExperimentalBadgeProps) => {
  const [visible, setVisible] = useState(false);

  const closePopover = () => {
    setVisible(false);
  };

  const handleIconClick = () => {
    setVisible((flag) => !flag);
  };

  return (
    <EuiPopover
      isOpen={visible}
      button={
        <EuiSmallButtonIcon
          color="text"
          iconType="beaker"
          onClick={handleIconClick}
          aria-label="Experimental badge"
        />
      }
      closePopover={closePopover}
      onClick={onClick}
    >
      <EuiTitle size="xs">
        <h4>Experimental</h4>
      </EuiTitle>
      <EuiHorizontalRule margin="s" />
      <EuiText>
        This is an experimental feature.
        <br />
        Send feedback via{' '}
        <EuiLink href="https://forum.opensearch.org/t/feedback-opensearch-assistant/16741">
          Forum
        </EuiLink>{' '}
        or <EuiLink href="https://opensearch.slack.com/channels/assistant-feedback">Slack</EuiLink>.
      </EuiText>
    </EuiPopover>
  );
};
