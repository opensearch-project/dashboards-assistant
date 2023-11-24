/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import {
  EuiPopover,
  EuiButtonIcon,
  EuiTitle,
  EuiHorizontalRule,
  EuiText,
  EuiPopoverProps,
} from '@elastic/eui';

interface ChatExperimentalBadgeProps {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const ChatExperimentalBadge = ({ onClick }: ChatExperimentalBadgeProps) => {
  const [visible, setVisible] = useState(false);

  const closePopover = useCallback(() => {
    setVisible(false);
  }, []);

  const handleIconClick = useCallback((e) => {
    setVisible((flag) => !flag);
  }, []);

  return (
    <EuiPopover
      isOpen={visible}
      button={<EuiButtonIcon color="text" iconType="beaker" onClick={handleIconClick} />}
      closePopover={closePopover}
      onClick={onClick}
    >
      <EuiTitle size="xs">
        <h4>Experimental</h4>
      </EuiTitle>
      <EuiHorizontalRule margin="none" />
      <EuiText>
        This is an experimental feature.
        <br />
        Send feedback via <a href="mailto:">Email</a> or <a href="slack:">Slack</a>.
      </EuiText>
    </EuiPopover>
  );
};
