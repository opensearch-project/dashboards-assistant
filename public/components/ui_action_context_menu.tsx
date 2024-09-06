/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { EuiButtonIcon, EuiContextMenu, EuiPopover } from '@elastic/eui';

import { buildContextMenuForActions } from '../../../../src/plugins/ui_actions/public';
import { AI_ASSISTANT_QUERY_EDITOR_TRIGGER } from '../ui_triggers';
import { getUiActions } from '../services';
import assistantTriggerIcon from '../assets/assistant_trigger.svg';

export const ActionContextMenu = () => {
  const uiActions = getUiActions();
  const actionsRef = useRef(uiActions.getTriggerActions(AI_ASSISTANT_QUERY_EDITOR_TRIGGER));
  const [open, setOpen] = useState(false);

  const panels = useAsync(
    () =>
      buildContextMenuForActions({
        actions: actionsRef.current.map((action) => ({
          action,
          context: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trigger: AI_ASSISTANT_QUERY_EDITOR_TRIGGER as any,
        })),
        closeMenu: () => setOpen(false),
      }),
    []
  );

  if (actionsRef.current.length === 0) {
    return null;
  }

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          aria-label="AI assistant trigger button"
          size="s"
          iconType={assistantTriggerIcon}
          onClick={() => setOpen(!open)}
        />
      }
      isOpen={open}
      panelPaddingSize="none"
      anchorPosition="downRight"
      closePopover={() => setOpen(false)}
    >
      <EuiContextMenu size="s" initialPanelId={'mainMenu'} panels={panels.value} />
    </EuiPopover>
  );
};
