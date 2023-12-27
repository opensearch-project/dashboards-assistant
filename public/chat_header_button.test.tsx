/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, fireEvent, screen } from '@testing-library/react';

import { HeaderChatButton } from './chat_header_button';
import { applicationServiceMock } from '../../../src/core/public/mocks';
import { AssistantActions } from './types';
import { BehaviorSubject } from 'rxjs';

let mockSend: jest.Mock;
let mockLoadChat: jest.Mock;

jest.mock('./hooks/use_chat_actions', () => {
  mockSend = jest.fn();
  mockLoadChat = jest.fn();
  return {
    useChatActions: jest.fn().mockReturnValue({
      send: mockSend,
      loadChat: mockLoadChat,
      openChatUI: jest.fn(),
      executeAction: jest.fn(),
      abortAction: jest.fn(),
      regenerate: jest.fn(),
    }),
  };
});

jest.mock('./chat_flyout', () => {
  return {
    ChatFlyout: ({
      toggleFlyoutFullScreen,
      flyoutFullScreen,
    }: {
      toggleFlyoutFullScreen: () => void;
      flyoutFullScreen: boolean;
    }) => (
      <div aria-label="chat flyout mock">
        <button onClick={toggleFlyoutFullScreen}>toggle chat flyout fullscreen</button>
        <p>{flyoutFullScreen ? 'fullscreen mode' : 'dock-right mode'}</p>
      </div>
    ),
  };
});

describe('<HeaderChatButton />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should open chat flyout and send the initial message', () => {
    const applicationStart = {
      ...applicationServiceMock.createStartContract(),
      currentAppId$: new BehaviorSubject(''),
    };
    render(
      <HeaderChatButton
        application={applicationStart}
        userHasAccess={true}
        contentRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user', tenant: 'test_tenant' }}
      />
    );

    act(() => applicationStart.currentAppId$.next('mock_app_id'));

    screen.getByLabelText('chat input').focus();
    fireEvent.change(screen.getByLabelText('chat input'), {
      target: { value: 'what indices are in my cluster?' },
    });
    expect(screen.getByLabelText('chat input')).toHaveFocus();

    fireEvent.keyPress(screen.getByLabelText('chat input'), {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
    });

    // start a new chat
    expect(mockLoadChat).toHaveBeenCalled();
    // send chat message
    expect(mockSend).toHaveBeenCalledWith({
      type: 'input',
      contentType: 'text',
      content: 'what indices are in my cluster?',
      context: { appId: 'mock_app_id' },
    });
    // chat flyout displayed
    expect(screen.queryByLabelText('chat flyout mock')).toBeInTheDocument();
    // the input value is cleared after pressing enter
    expect(screen.getByLabelText('chat input')).toHaveValue('');
    expect(screen.getByLabelText('chat input')).not.toHaveFocus();
  });

  it('should toggle chat flyout size', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={true}
        contentRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user', tenant: 'test_tenant' }}
      />
    );
    fireEvent.click(screen.getByLabelText('toggle chat flyout icon'));
    expect(screen.queryByText('dock-right mode')).toBeInTheDocument();

    fireEvent.click(screen.getByText('toggle chat flyout fullscreen'));
    expect(screen.queryByText('fullscreen mode')).toBeInTheDocument();
  });

  it('should focus in chat input when click and press Escape should blur', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={true}
        contentRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user', tenant: 'test_tenant' }}
      />
    );
    screen.getByLabelText('chat input').focus();
    expect(screen.getByLabelText('chat input')).toHaveFocus();
    expect(screen.getByTitle('press enter to chat')).toBeInTheDocument();

    fireEvent.keyUp(screen.getByLabelText('chat input'), {
      key: 'Escape',
      code: 'Escape',
      charCode: 27,
    });
    expect(screen.getByLabelText('chat input')).not.toHaveFocus();
    expect(screen.getByTitle('press ⌘ + / to start typing')).toBeInTheDocument();
  });

  it('should focus on chat input when pressing global shortcut', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={true}
        contentRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user', tenant: 'test_tenant' }}
      />
    );
    expect(screen.getByLabelText('chat input')).not.toHaveFocus();
    fireEvent.keyDown(document.body, {
      key: '/',
      code: 'NumpadDivide',
      charCode: 111,
      metaKey: true,
    });
    expect(screen.getByLabelText('chat input')).toHaveFocus();
  });

  it('should disable chat input when no access', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={false}
        contentRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user', tenant: 'test_tenant' }}
      />
    );
    expect(screen.getByLabelText('chat input')).toBeDisabled();
  });

  it('should not focus on chat input when no access and pressing global shortcut', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={false}
        contentRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user', tenant: 'test_tenant' }}
      />
    );
    expect(screen.getByLabelText('chat input')).not.toHaveFocus();
    fireEvent.keyDown(document.body, {
      key: '/',
      code: 'NumpadDivide',
      charCode: 111,
      metaKey: true,
    });
    expect(screen.getByLabelText('chat input')).not.toHaveFocus();
  });
});
