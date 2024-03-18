/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiContextMenuItem, EuiContextMenuPanel, EuiPopover, EuiButtonIcon } from '@elastic/eui';
import React, { useCallback, useMemo, useState } from 'react';
import { useCore } from '../contexts/core_context';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from '../../../../src/core/public';
import { useChatContext } from '../contexts/chat_context';
import {
  DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
  DEFAULT_SIDECAR_TAKEOVER_PADDING_TOP_SIZE,
} from '../utils/constants';

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
  const { sidecarDockedMode, setSidecarDockedMode } = useChatContext();
  const core = useCore();

  const onButtonClick = useCallback(() => {
    setPopoverOpen((flag) => !flag);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  const setDockedMode = useCallback(
    (mode: ISidecarConfig['dockedMode']) => {
      const previousMode = sidecarDockedMode;
      if (previousMode === mode) {
        return;
      } else {
        if (mode === SIDECAR_DOCKED_MODE.TAKEOVER) {
          const defaultTakeOverSize =
            window.innerHeight - DEFAULT_SIDECAR_TAKEOVER_PADDING_TOP_SIZE;
          core.overlays.sidecar().setSidecarConfig({
            dockedMode: mode,
            paddingSize: defaultTakeOverSize,
          });
        } else {
          let newConfig;
          if (previousMode !== SIDECAR_DOCKED_MODE.TAKEOVER) {
            // Maintain the same panel sidecar width when switching between both dock left and dock right.
            newConfig = {
              dockedMode: mode,
            };
          } else {
            newConfig = {
              dockedMode: mode,
              paddingSize: DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
            };
          }
          core.overlays.sidecar().setSidecarConfig(newConfig);
        }
        setSidecarDockedMode(mode);
      }
    },
    [setSidecarDockedMode, sidecarDockedMode]
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
          icon={sidecarDockedMode === mode ? 'check' : icon}
          data-test-subj={`sidecar-mode-icon-menu-item-${mode}`}
        >
          {name}
        </EuiContextMenuItem>
      )),
    [sidecarDockedMode, closePopover]
  );

  const selectMenuItemIndex = useMemo(() => {
    return ALL_SIDECAR_DIRECTIONS.findIndex((item) => item.mode === sidecarDockedMode);
  }, [sidecarDockedMode]);

  return (
    <>
      <EuiPopover
        id="sidecarModeIcon"
        button={
          <EuiButtonIcon
            aria-label="setSidecarMode"
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
        <EuiContextMenuPanel size="m" items={menuItems} data-test-subj="sidecar-mode-icon-menu" />
      </EuiPopover>
    </>
  );
};
