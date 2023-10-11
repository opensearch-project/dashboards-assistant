/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { TabId } from '../tabs/chat_tab_bar';
import { ActionExecutor, ContentRenderer } from '../types';

export interface IChatContext {
  appId?: string;
  sessionID?: string;
  setSessionID: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedTabId: TabId;
  setSelectedTabId: React.Dispatch<React.SetStateAction<TabId>>;
  flyoutVisible: boolean;
  setFlyoutVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setFlyoutComponent: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  chatEnabled: boolean;
  contentRenderers: Record<string, ContentRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
}
export const ChatContext = React.createContext<IChatContext | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('ChatContext is not set');
  return context;
};
