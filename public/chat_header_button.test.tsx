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
import * as coreContextExports from './contexts/core_context';
import { MountWrapper } from '../../../src/core/public/utils';

let mockSend: jest.Mock;
let mockLoadChat: jest.Mock;
let mockIncontextInsightRegistry: jest.Mock;

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
    ChatFlyout: () => <div aria-label="chat flyout mock" />,
  };
});

jest.mock('./services', () => {
  mockIncontextInsightRegistry = jest.fn().mockReturnValue({
    on: jest.fn(),
    off: jest.fn(),
  });
  return {
    getIncontextInsightRegistry: mockIncontextInsightRegistry,
  };
});

// mock sidecar open,hide and show
jest.spyOn(coreContextExports, 'useCore').mockReturnValue({
  overlays: {
    // @ts-ignore
    sidecar: () => {
      const attachElement = document.createElement('div');
      attachElement.id = 'sidecar-mock-div';
      return {
        open: (mountPoint) => {
          document.body.appendChild(attachElement);
          render(<MountWrapper mount={mountPoint} />, {
            container: attachElement,
          });
        },
        hide: () => {
          const element = document.getElementById('sidecar-mock-div');
          if (element) {
            element.style.display = 'none';
          }
        },
        show: () => {
          const element = document.getElementById('sidecar-mock-div');
          if (element) {
            element.style.display = 'block';
          }
        },
      };
    },
  },
});

describe('<HeaderChatButton />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should open chat flyout, send the initial message and hide and show flyout', () => {
    const applicationStart = {
      ...applicationServiceMock.createStartContract(),
      currentAppId$: new BehaviorSubject(''),
    };
    render(
      <HeaderChatButton
        application={applicationStart}
        userHasAccess={true}
        messageRenderers={{}}
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

    // sidecar show
    const toggleButton = screen.getByLabelText('toggle chat flyout icon');
    fireEvent.click(toggleButton);
    expect(screen.queryByLabelText('chat flyout mock')).not.toBeVisible();
    // sidecar hide
    fireEvent.click(toggleButton);
    expect(screen.queryByLabelText('chat flyout mock')).toBeVisible();
  });

  it('should focus in chat input when click and press Escape should blur', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={true}
        messageRenderers={{}}
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
    expect(screen.getByTitle('press Ctrl + / to start typing')).toBeInTheDocument();
  });

  it('should focus on chat input when pressing global shortcut', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={true}
        messageRenderers={{}}
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
      ctrlKey: true,
    });
    expect(screen.getByLabelText('chat input')).toHaveFocus();
  });

  it('should disable chat input when no access', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        userHasAccess={false}
        messageRenderers={{}}
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
        messageRenderers={{}}
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
