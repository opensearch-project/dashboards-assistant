/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { ChatWindowHeader } from '../chat_window_header';
import * as chatContextExports from '../../contexts/chat_context';
import { TabId } from '../../types';
import { SIDECAR_DOCKED_MODE } from '../../../../../src/core/public';
import { setupConfigSchemaMock } from '../../../test/config_schema_mock';

jest.mock('../../components/chat_window_header_title', () => {
  return { ChatWindowHeaderTitle: () => <div>OpenSearch Assistant</div> };
});

jest.mock('../../services');

const setup = ({ selectedTabId }: { selectedTabId?: TabId } = {}) => {
  const useChatContextMock = {
    conversationId: '1',
    title: 'foo',
    selectedTabId: selectedTabId || 'chat',
    setConversationId: jest.fn(),
    setTitle: jest.fn(),
    setFlyoutVisible: jest.fn(),
    setSelectedTabId: jest.fn(),
    setFlyoutComponent: jest.fn(),
    sidecarDockedMode: SIDECAR_DOCKED_MODE.RIGHT,
  };
  jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue(useChatContextMock);
  const renderResult = render(<ChatWindowHeader />);

  return {
    renderResult,
    useChatContextMock,
  };
};

describe('<ChatWindowHeader />', () => {
  beforeEach(() => {
    setupConfigSchemaMock();
  });
  it('should render title, history, setSidecarMode and close button', () => {
    const { renderResult } = setup();
    expect(renderResult.getByText('OpenSearch Assistant')).toBeInTheDocument();
    expect(renderResult.getByLabelText('history')).toBeInTheDocument();
    expect(renderResult.getByLabelText('setSidecarMode')).toBeInTheDocument();
    expect(renderResult.getByLabelText('close')).toBeInTheDocument();
  });

  it('should not display conversation list when feature flag is false', () => {
    setupConfigSchemaMock({
      chat: {
        showConversationHistory: false,
      },
    });
    const { renderResult } = setup();
    expect(renderResult.queryByLabelText('history')).not.toBeInTheDocument();
  });

  it('should not display conversation history icon when feature flag is false', () => {});
  it('should call setFlyoutVisible with false after close button clicked', () => {
    const { renderResult, useChatContextMock } = setup();

    expect(useChatContextMock.setFlyoutVisible).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByLabelText('close'));
    expect(useChatContextMock.setFlyoutVisible).toHaveBeenLastCalledWith(false);
  });

  it('should call setFlyoutComponent with undefined after history button click', () => {
    const { renderResult, useChatContextMock } = setup();

    expect(useChatContextMock.setFlyoutComponent).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByLabelText('history'));
    expect(useChatContextMock.setFlyoutComponent).toHaveBeenLastCalledWith(undefined);
  });

  it('should call setSelectedTabId with "chat" when selectedTabId is "history"', () => {
    const { renderResult, useChatContextMock } = setup({
      selectedTabId: 'history',
    });

    expect(useChatContextMock.setSelectedTabId).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByLabelText('history'));
    expect(useChatContextMock.setSelectedTabId).toHaveBeenLastCalledWith('chat');
  });

  it('should call setSelectedTabId with "history" when selectedTabId is "chat"', () => {
    const { renderResult, useChatContextMock } = setup({
      selectedTabId: 'chat',
    });

    expect(useChatContextMock.setSelectedTabId).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByLabelText('history'));
    expect(useChatContextMock.setSelectedTabId).toHaveBeenLastCalledWith('history');
  });
});
