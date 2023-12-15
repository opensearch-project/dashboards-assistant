/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { ActionExecutor, ContentRenderer, UserAccount, TabId } from '../types';

export interface IChatContext {
  appId?: string;
  sessionId?: string;
  setSessionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedTabId: TabId;
  preSelectedTabId?: TabId;
  setSelectedTabId: (tabId: TabId) => void;
  flyoutVisible: boolean;
  flyoutFullScreen: boolean;
  setFlyoutVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setFlyoutComponent: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  userHasAccess: boolean;
  contentRenderers: Record<string, ContentRenderer>;
  actionExecutors: Record<string, ActionExecutor>;
  currentAccount: UserAccount;
  title?: string;
  setTitle: React.Dispatch<React.SetStateAction<string | undefined>>;
  traceId?: string;
  setTraceId: React.Dispatch<React.SetStateAction<string | undefined>>;
  rootAgentId?: string;
}
export const ChatContext = React.createContext<IChatContext | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('ChatContext is not set');
  return context;
};
