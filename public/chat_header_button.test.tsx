/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, fireEvent, screen, waitFor } from '@testing-library/react';
import { BehaviorSubject, Subject } from 'rxjs';

import { HeaderChatButton } from './chat_header_button';
import { applicationServiceMock } from '../../../src/core/public/mocks';
import { HeaderVariant, ISidecarConfig, SIDECAR_DOCKED_MODE } from '../../../src/core/public';
import { AssistantActions } from './types';
import * as coreContextExports from './contexts/core_context';
import { MountWrapper } from '../../../src/core/public/utils';
import * as persistedChatbotStateExports from './utils/persisted_chatbot_state';

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

const getSidecarConfig$Mock = jest.fn(
  () => new BehaviorSubject<ISidecarConfig | undefined>(undefined)
);

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
        getSidecarConfig$: getSidecarConfig$Mock,
      };
    },
  },
});

describe('<HeaderChatButton />', () => {
  beforeAll(() => {
    jest.spyOn(persistedChatbotStateExports, 'getChatbotOpenStatus').mockReturnValue(false);
    jest.spyOn(persistedChatbotStateExports, 'setChatbotOpenStatus').mockImplementation();
    jest.spyOn(persistedChatbotStateExports, 'getChatbotState').mockReturnValue(null);
    jest.spyOn(persistedChatbotStateExports, 'setChatbotState').mockImplementation();
    jest.spyOn(persistedChatbotStateExports, 'setChatbotSidecarConfig').mockImplementation();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open chat flyout, send the initial message and hide and show flyout', async () => {
    const applicationStart = {
      ...applicationServiceMock.createStartContract(),
      currentAppId$: new BehaviorSubject(''),
    };

    const { getByLabelText } = render(
      <HeaderChatButton
        application={applicationStart}
        messageRenderers={{}}
        actionExecutors={{}}
        assistantActions={{} as AssistantActions}
        currentAccount={{ username: 'test_user' }}
      />
    );

    act(() => applicationStart.currentAppId$.next('mock_app_id'));

    fireEvent.click(getByLabelText('toggle chat flyout icon'));
    // chat flyout displayed
    expect(screen.queryByLabelText('chat flyout mock')).toBeInTheDocument();

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
    expect(screen.getByLabelText('toggle chat flyout icon')).toBeInTheDocument();
  });

  it('should load latest conversion and display chat flyout', async () => {
    jest.spyOn(persistedChatbotStateExports, 'getChatbotOpenStatus').mockReturnValueOnce(true);
    jest.spyOn(conversationLoadMock, 'load');

    expect(conversationLoadMock.load).not.toHaveBeenCalled();
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

    await waitFor(() => {
      // chat flyout displayed
      expect(screen.queryByLabelText('chat flyout mock')).toBeInTheDocument();
      expect(conversationLoadMock.load).toHaveBeenCalled();
    });
  });

  it('should call setChatbotSidecarConfig after sidecar config updated', async () => {
    const sidecarConfig$ = new BehaviorSubject<ISidecarConfig | undefined>(undefined);
    getSidecarConfig$Mock.mockReturnValue(sidecarConfig$);

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

    const newSidecarConfig = { dockedMode: SIDECAR_DOCKED_MODE.LEFT, paddingSize: 300 };
    sidecarConfig$.next(newSidecarConfig);

    await waitFor(() => {
      expect(persistedChatbotStateExports.setChatbotSidecarConfig).toHaveBeenCalledWith(
        newSidecarConfig
      );
    });
  });

  it('should call setChatbotStatus after sidecar config updated', async () => {
    const sidecarConfig$ = new BehaviorSubject<ISidecarConfig | undefined>(undefined);
    getSidecarConfig$Mock.mockReturnValue(sidecarConfig$);

    const applicationStart = {
      ...applicationServiceMock.createStartContract(),
      currentAppId$: new BehaviorSubject(''),
    };
    const { getByLabelText } = render(
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
      expect(persistedChatbotStateExports.setChatbotOpenStatus).toHaveBeenCalledWith(true);
    });

    fireEvent.click(getByLabelText('toggle chat flyout icon'));

    await waitFor(() => {
      expect(persistedChatbotStateExports.setChatbotOpenStatus).toHaveBeenCalledWith(false);
    });
  });
});
