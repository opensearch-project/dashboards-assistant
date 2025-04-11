/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, fireEvent, screen, waitFor } from '@testing-library/react';
import { BehaviorSubject, Subject } from 'rxjs';

import { HeaderChatButton } from './chat_header_button';
import { applicationServiceMock } from '../../../src/core/public/mocks';
import { HeaderVariant } from '../../../src/core/public';
import { AssistantActions } from './types';
import * as coreContextExports from './contexts/core_context';
import { MountWrapper } from '../../../src/core/public/utils';

import { coreMock } from '../../../src/core/public/mocks';
import { ConversationsService } from './services/conversations_service';
import { ConversationLoadService } from './services/conversation_load_service';

let mockIncontextInsightRegistry: jest.Mock;
let mockGetLogoIcon: jest.Mock;

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
  mockGetLogoIcon = jest.fn().mockReturnValue('');
  return {
    getIncontextInsightRegistry: mockIncontextInsightRegistry,
    getLogoIcon: mockGetLogoIcon,
  };
});

const sideCarHideMock = jest.fn(() => {
  const element = document.getElementById('sidecar-mock-div');
  if (element) {
    element.style.display = 'none';
  }
});

const sideCarRefMock = {
  close: jest.fn(),
};

const coreStartMock = coreMock.createStart();

coreStartMock.http.get.mockImplementation(async (requestPath: string, _options) => {
  if (requestPath === '/api/assistant/conversation') {
    return {
      title: 'a-existing-conversation',
      messages: [{}],
    };
  }
  if (requestPath === '/api/assistant/conversations') {
    return {
      objects: [
        {
          id: '1',
          title: 'foo',
        },
      ],
      total: 100,
    };
  }
  return {};
});

const dataSourceMock = {
  dataSourceIdUpdates$: new Subject<string | null>(),
  getDataSourceQuery: jest.fn(() => ({ dataSourceId: 'foo' })),
};

const conversationLoadMock = new ConversationLoadService(coreStartMock.http, dataSourceMock);

// mock sidecar open,hide and show
jest.spyOn(coreContextExports, 'useCore').mockReturnValue({
  services: {
    ...coreStartMock,
    conversations: new ConversationsService(coreStartMock.http, dataSourceMock),
    conversationLoad: conversationLoadMock,
    dataSource: dataSourceMock,
  },
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
          return sideCarRefMock;
        },
        hide: sideCarHideMock,
        show: () => {
          const element = document.getElementById('sidecar-mock-div');
          if (element) {
            element.style.display = 'block';
          }
        },
        getSidecarConfig$: () => {
          return new BehaviorSubject(undefined);
        },
      };
    },
  },
});

describe('<HeaderChatButton />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open chat flyout, send the initial message and hide and show flyout', async () => {
    const applicationStart = {
      ...applicationServiceMock.createStartContract(),
      currentAppId$: new BehaviorSubject(''),
    };
    render(
      <HeaderChatButton
        application={applicationStart}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user' }}
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

    // call send message API with new chat
    await waitFor(() => {
      expect(coreStartMock.http.post).lastCalledWith(
        '/api/assistant/send_message',
        expect.objectContaining({
          body: JSON.stringify({
            messages: [],
            input: {
              type: 'input',
              contentType: 'text',
              content: 'what indices are in my cluster?',
              context: { appId: 'mock_app_id' },
            },
          }),
        })
      );
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
    await waitFor(() => {
      expect(screen.queryByLabelText('chat flyout mock')).toBeVisible();
    });
  });

  it('should call send message without active conversation id after input text submitted', async () => {
    const activeConversationId = 'test-conversation';
    const assistantActions = {} as AssistantActions;
    const applicationStart = {
      ...applicationServiceMock.createStartContract(),
      currentAppId$: new BehaviorSubject(''),
    };
    render(
      <HeaderChatButton
        application={applicationStart}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={assistantActions}
        currentAccount={{ username: 'test_user' }}
      />
    );

    act(() => applicationStart.currentAppId$.next('mock_app_id'));

    act(() => {
      assistantActions.loadChat(activeConversationId);
    });

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

    await waitFor(() => {
      expect(coreStartMock.http.post).lastCalledWith(
        '/api/assistant/send_message',
        expect.objectContaining({
          body: expect.not.stringContaining(activeConversationId),
        })
      );
    });
  });

  it('should focus in chat input when click and press Escape should blur', () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user' }}
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

  it('should focus on chat input when pressing global shortcut', async () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user' }}
      />
    );
    expect(screen.getByLabelText('chat input')).not.toHaveFocus();
    fireEvent.keyDown(document.body, {
      key: '/',
      code: 'NumpadDivide',
      charCode: 111,
      ctrlKey: true,
    });
    await waitFor(() => {
      expect(screen.getByLabelText('chat input')).toHaveFocus();
    });
  });

  it('should not focus on chat input when no access and pressing global shortcut', async () => {
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user' }}
      />
    );
    expect(screen.getByLabelText('chat input')).not.toHaveFocus();
    fireEvent.keyDown(document.body, {
      key: '/',
      code: 'NumpadDivide',
      charCode: 111,
      metaKey: true,
    });
    await waitFor(() => {
      expect(screen.getByLabelText('chat input')).not.toHaveFocus();
    });
  });

  it('should call sidecar hide and close when button unmount and chat flyout is visible', async () => {
    const applicationStart = {
      ...applicationServiceMock.createStartContract(),
      currentAppId$: new BehaviorSubject(''),
    };
    const { unmount, getByLabelText } = render(
      <HeaderChatButton
        application={applicationStart}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user' }}
      />
    );

    fireEvent.click(getByLabelText('toggle chat flyout icon'));

    await waitFor(() => {
      expect(sideCarHideMock).not.toHaveBeenCalled();
      expect(sideCarRefMock.close).not.toHaveBeenCalled();
    });

    unmount();
    await waitFor(() => {
      expect(sideCarHideMock).toHaveBeenCalled();
      expect(sideCarRefMock.close).toHaveBeenCalled();
    });
  });

  it('should render toggle chat flyout button icon', () => {
    coreStartMock.chrome.getHeaderVariant$.mockReturnValue(
      new BehaviorSubject(HeaderVariant.APPLICATION)
    );
    render(
      <HeaderChatButton
        application={applicationServiceMock.createStartContract()}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user' }}
        inLegacyHeader={false}
      />
    );
    expect(screen.getByLabelText('toggle chat flyout button icon')).toBeInTheDocument();
  });
});
