/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import React, { useCallback } from 'react';
import { IChatContext, useChatContext } from '../contexts/chat_context';
import { TAB_ID } from '../utils/constants';
import { SidecarIconMenu } from '../components/sidecar_icon_menu';

export const ChatOverrideHeader = React.memo(() => {
  const chatContext = useChatContext() as IChatContext;
  const { setSelectedTabId, setFlyoutComponent, setOverrideName } = chatContext;

  const handleBack = useCallback(() => {
    setSelectedTabId(TAB_ID.CHAT);
    setFlyoutComponent(null);
    setOverrideName(undefined);
  }, [setSelectedTabId]);

  return (
    <>
      <EuiFlexGroup
        gutterSize="s"
        justifyContent="spaceAround"
        alignItems="center"
        responsive={false}
      >
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
            <EuiButtonEmpty flush="left" size="xs" onClick={handleBack} iconType="arrowLeft">
              {chatContext?.overrideName || 'Back'}
            </EuiButtonEmpty>
          </EuiFlexGroup>
        </EuiFlexItem>
        <SidecarIconMenu />
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            aria-label="close"
            size="xs"
            color="text"
            iconType="cross"
            onClick={() => {
              chatContext.setFlyoutVisible(false);
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} />
      </EuiFlexGroup>
    </>
  );
});
