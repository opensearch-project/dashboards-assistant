/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { EuiButtonEmpty, EuiContextMenu, EuiPopover } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { buildContextMenuForActions } from '../../../../src/plugins/ui_actions/public';
import { AI_ASSISTANT_QUERY_EDITOR_TRIGGER } from '../ui_triggers';
import { getUiActions } from '../services';
import { DataPublicPluginSetup } from '../../../../src/plugins/data/public';

interface Props {
  data: DataPublicPluginSetup;
  label?: string;
}

export const ActionContextMenu = (props: Props) => {
  const uiActions = getUiActions();
  const actionsRef = useRef(uiActions.getTriggerActions(AI_ASSISTANT_QUERY_EDITOR_TRIGGER));
  const [open, setOpen] = useState(false);
  const [actionContext, setActionContext] = useState({
    datasetId: props.data.query.queryString.getQuery().dataset?.id ?? '',
    datasetType: props.data.query.queryString.getQuery().dataset?.type ?? '',
    dataSourceId: props.data.query.queryString.getQuery().dataset?.dataSource?.id,
  });

  useEffect(() => {
    const subscription = props.data.query.queryString.getUpdates$().subscribe((query) => {
      if (query.dataset) {
        setActionContext((state) => ({
          ...state,
          datasetId: query.dataset?.id ?? '',
          datasetType: query.dataset?.type ?? '',
          dataSourceId: query.dataset?.dataSource?.id,
        }));
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [props.data.query.queryString]);

  const panels = useAsync(
    () =>
      buildContextMenuForActions({
        actions: actionsRef.current.map((action) => ({
          action,
          context: {
            datasetId: actionContext.datasetId,
            datasetType: actionContext.datasetType,
            dataSourceId: actionContext.dataSourceId,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trigger: AI_ASSISTANT_QUERY_EDITOR_TRIGGER as any,
        })),
        closeMenu: () => setOpen(false),
        title: '',
      }),
    [actionContext.datasetId, actionContext.datasetType, actionContext.dataSourceId]
  );

  if (actionsRef.current.length === 0) {
    return null;
  }

  // If context menu has no item, the action button should be disabled
  const actionDisabled = (panels.value?.[0]?.items ?? []).length === 0;

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
          isDisabled={actionDisabled}
          isLoading={panels.loading}
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
