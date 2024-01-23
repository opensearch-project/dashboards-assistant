/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiContextMenuItem, EuiContextMenuPanel, EuiPopover, EuiButtonIcon } from '@elastic/eui';
import React, { useCallback, useMemo, useState } from 'react';
import { useCore } from '../contexts/core_context';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from '../../../../src/core/public';
import { useChatContext } from '../contexts/chat_context';

const ALL_SIDECAR_DIRECTIONS: Array<{
  mode: ISidecarConfig['dockedMode'];
  name: string;
  icon: string;
}> = [
  {
    mode: SIDECAR_DOCKED_MODE.RIGHT,
    name: 'Dock Right',
    icon: 'dockedRight',
  },
  {
    mode: SIDECAR_DOCKED_MODE.LEFT,
    name: 'Dock Left',
    icon: 'dockedLeft',
  },
  {
    mode: SIDECAR_DOCKED_MODE.TAKEOVER,
    name: 'Dock Full Width',
    icon: 'dockedTakeover',
  },
];

export const SidecarIconMenu = () => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const chatContext = useChatContext();
  const core = useCore();

  const onButtonClick = useCallback(() => {
    setPopoverOpen((flag) => !flag);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  const setDockedMode = useCallback(
    (mode: ISidecarConfig['dockedMode']) => {
      const currentMode = chatContext.sidecarDockedMode;
      if (currentMode === mode) {
        return;
      } else {
        if (mode === 'takeover') {
          core.overlays.sidecar().setSidecarConfig({
            dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
            paddingSize: window.innerHeight - 136,
          });
        } else {
          core.overlays.sidecar().setSidecarConfig({
            dockedMode: mode,
            paddingSize: 460,
          });
        }
        chatContext.setSidecarDockedMode(mode);
      }
    },
    [chatContext]
  );

  const menuItems = useMemo(
    () =>
      ALL_SIDECAR_DIRECTIONS.map(({ name, icon, mode }) => (
        <EuiContextMenuItem
          key={mode}
          onClick={() => {
            closePopover();
            setDockedMode(mode);
          }}
          icon={chatContext.sidecarDockedMode === mode ? 'check' : icon}
        >
          {name}
        </EuiContextMenuItem>
      )),
    [chatContext]
  );

  const selectMenuItemIndex = useMemo(() => {
    const dockedMode = chatContext.sidecarDockedMode;
    return ALL_SIDECAR_DIRECTIONS.findIndex((item) => item.mode === dockedMode);
  }, [chatContext]);

  return (
    <>
      <EuiPopover
        id="sidecarModeIcon"
        button={
          <EuiButtonIcon
            aria-label="fullScreen"
            size="xs"
            iconType={ALL_SIDECAR_DIRECTIONS[selectMenuItemIndex].icon}
            onClick={onButtonClick}
          />
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize="none"
        anchorPosition="downRight"
      >
        <EuiContextMenuPanel size="m" items={menuItems} />
      </EuiPopover>
    </>
  );
};
