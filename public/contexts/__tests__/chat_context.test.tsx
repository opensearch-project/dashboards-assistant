/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useChatContext, ChatContext } from '../chat_context';

describe('useChatContext', () => {
  it('should return chat context after useChatContext called', () => {
    const chatContextValueMock = {
      setConversationId: jest.fn(),
      selectedTabId: 'chat' as const,
      setSelectedTabId: jest.fn(),
      flyoutVisible: true,
      flyoutFullScreen: true,
      setFlyoutVisible: jest.fn(),
      setFlyoutComponent: jest.fn(),
      userHasAccess: true,
      messageRenderers: {},
      actionExecutors: {},
      currentAccount: { username: 'foo', tenant: '' },
      setTitle: jest.fn(),
      setInteractionId: jest.fn(),
    };
    const { result } = renderHook(useChatContext, {
      wrapper: ({ children }) => (
        <ChatContext.Provider value={chatContextValueMock}>{children}</ChatContext.Provider>
      ),
    });

    expect(result.current).toBe(chatContextValueMock);
  });

  it('should return error if context provider missed', () => {
    const { result } = renderHook(useChatContext);

    expect(result.error).toMatchInlineSnapshot(`[Error: ChatContext is not set]`);
  });
});
