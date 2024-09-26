/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { EuiButtonEmpty, EuiContextMenu, EuiPopover } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { buildContextMenuForActions } from '../../../../src/plugins/ui_actions/public';
import { AI_ASSISTANT_QUERY_EDITOR_TRIGGER } from '../ui_triggers';
import { getUiActions } from '../services';

interface Props {
  label?: string;
}

export const ActionContextMenu = (props: Props) => {
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
        <EuiButtonEmpty
          color="text"
          aria-label="AI assistant trigger button"
          size="xs"
          iconType="arrowDown"
          onClick={() => setOpen(!open)}
          iconSide="right"
          flush="both"
        >
          {props.label ||
            i18n.translate('dashboardAssistant.branding.assistantActionButton.label', {
              defaultMessage: 'AI assistant',
            })}
        </EuiButtonEmpty>
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
