/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiContextMenuItem, EuiContextMenuPanel, EuiPopover, EuiButtonIcon } from '@elastic/eui';
import React, { useCallback, useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import { useCore } from '../contexts/core_context';
import { ISidecarConfig } from '../../../../src/core/public';

const ALL_SIDECAR_DIRECTIONS: Array<{
  mode: ISidecarConfig['dockedMode'];
  name: string;
  icon: string;
}> = [
  {
    mode: 'right',
    name: 'Dock Right',
    icon: 'dockedRight',
  },
  {
    mode: 'left',
    name: 'Dock Left',
    icon: 'dockedLeft',
  },
  {
    mode: 'takeover',
    name: 'Dock Full Width',
    icon: 'dockedTakeover',
  },
];

export const SidecarIconMenu = () => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const core = useCore();
  const sidecarConfig = useObservable(core.overlays.sidecar().getSidecarConfig$());

  const onButtonClick = useCallback(() => {
    setPopoverOpen((flag) => !flag);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  const setDockedMode = useCallback(
    (mode: ISidecarConfig['dockedMode']) => {
      const currentMode = sidecarConfig?.dockedMode;
      if (currentMode === mode) {
        return;
      } else {
        if (mode === 'takeover') {
          core.overlays.sidecar().setSidecarConfig({
            dockedMode: 'takeover',
            paddingSize: window.innerHeight - 136,
          });
        } else {
          core.overlays.sidecar().setSidecarConfig({
            dockedMode: mode,
            paddingSize: 460,
          });
        }
      }
    },
    [sidecarConfig]
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
          icon={sidecarConfig?.dockedMode === mode ? 'check' : icon}
        >
          {name}
        </EuiContextMenuItem>
      )),
    [sidecarConfig]
  );

  const selectMenuItemIndex = useMemo(() => {
    const dockedMode = sidecarConfig?.dockedMode ?? 'right';
    return ALL_SIDECAR_DIRECTIONS.findIndex((item) => item.mode === dockedMode);
  }, [sidecarConfig]);

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
