/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { act, waitFor, render, screen, fireEvent } from '@testing-library/react';
import * as chatContextExports from '../contexts/chat_context';
import { AgentFrameworkTracesFlyoutBody } from './agent_framework_traces_flyout_body';
import { TAB_ID } from '../utils/constants';

jest.mock('./agent_framework_traces', () => {
  return {
    AgentFrameworkTraces: () => <div />,
  };
});

describe('<AgentFrameworkTracesFlyout/> spec', () => {
  it('show back button if interactionId exists', async () => {
    const onCloseMock = jest.fn();
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      interactionId: 'test-interaction-Id',
      setSelectedTabId: onCloseMock,
    });
    render(<AgentFrameworkTracesFlyoutBody />);
    expect(screen.queryAllByLabelText('back')).toHaveLength(1);
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalledWith(TAB_ID.CHAT);
    });
  });

  it('no back button if interactionId does not exist', async () => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      interactionId: undefined,
    });
    render(<AgentFrameworkTracesFlyoutBody />);
    expect(screen.queryAllByLabelText('back')).toHaveLength(0);
  });

  it('fullscreen with opening from chat', async () => {
    const onCloseMock = jest.fn();
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      interactionId: 'test-interaction-id',
      flyoutFullScreen: true,
      setSelectedTabId: onCloseMock,
      preSelectedTabId: TAB_ID.CHAT,
    });
    render(<AgentFrameworkTracesFlyoutBody />);
    expect(screen.queryAllByLabelText('close')).toHaveLength(1);
    fireEvent.click(screen.queryAllByLabelText('close')[0]);
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalledWith(TAB_ID.CHAT);
    });
  });

  it('fullscreen with opening from history', async () => {
    const onCloseMock = jest.fn();
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      interactionId: 'test-interaction-id',
      flyoutFullScreen: true,
      setSelectedTabId: onCloseMock,
      preSelectedTabId: TAB_ID.HISTORY,
    });
    render(<AgentFrameworkTracesFlyoutBody />);
    expect(screen.queryAllByLabelText('back')).toHaveLength(1);
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalledWith(TAB_ID.HISTORY);
    });
  });
});
