/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiButtonIcon,
} from '@elastic/eui';
import React, { useCallback, useState } from 'react';

const dockBottom = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <g fill="currentColor">
      <path d="M3 1H13C14.1046 1 15 1.89543 15 3V13C15 14.1046 14.1046 15 13 15H3C1.89543 15 1 14.1046 1 13V3C1 1.89543 1.89543 1 3 1ZM3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3Z" />
      <path d="M3 9.5C3 9.22386 3.22386 9 3.5 9H12.5C12.7761 9 13 9.22386 13 9.5V12.5C13 12.7761 12.7761 13 12.5 13H3.5C3.22386 13 3 12.7761 3 12.5V9.5Z" />
    </g>
  </svg>
);

const dockRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <g fill="currentColor">
      <path d="M3 1H13C14.1046 1 15 1.89543 15 3V13C15 14.1046 14.1046 15 13 15H3C1.89543 15 1 14.1046 1 13V3C1 1.89543 1.89543 1 3 1ZM3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3Z" />
      <path d="M9 3.5C9 3.22386 9.22386 3 9.5 3H12.5C12.7761 3 13 3.22386 13 3.5V12.5C13 12.7761 12.7761 13 12.5 13H9.5C9.22386 13 9 12.7761 9 12.5V3.5Z" />
    </g>
  </svg>
);

interface Props {
  setDockedDirection: (direction: string) => void;
}

export const SidecarIconMenu = ({ setDockedDirection }) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const onButtonClick = useCallback(() => {
    setPopoverOpen((flag) => !flag);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  const button = (
    <EuiButtonIcon
      aria-label="fullScreen"
      color="text"
      size="xs"
      iconType={dockRight}
      onClick={onButtonClick}
    />
  );

  const items = [
    <EuiContextMenuItem
      key="rename-conversation"
      prefix="a"
      onClick={() => {
        closePopover();
        setDockedDirection('right');
      }}
    >
      Dock Right
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="new-conversation"
      onClick={() => {
        closePopover();
        setDockedDirection('left');
      }}
    >
      Dock Left
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="save-as-notebook"
      onClick={() => {
        closePopover();
        setDockedDirection('bottom');
      }}
    >
      Dock Full Width
    </EuiContextMenuItem>,
  ];

  return (
    <>
      <EuiPopover
        id="conversationTitle"
        button={button}
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize="none"
        anchorPosition="downRight"
      >
        <EuiContextMenuPanel size="m" items={items} />
      </EuiPopover>
    </>
  );
};
