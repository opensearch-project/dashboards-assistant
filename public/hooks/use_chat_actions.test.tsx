/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useChatActions } from './use_chat_actions';
import * as chatContextHookExports from '../contexts/chat_context';
import * as coreHookExports from '../contexts/core_context';
import { httpServiceMock } from '../../../../src/core/public/mocks';
import { SessionsService } from '../services/sessions_service';
import { SessionLoadService } from '../services/session_load_service';
import * as chatStateHookExports from './use_chat_state';
import { ASSISTANT_API } from '../../common/constants/llm';
import { IMessage } from 'common/types/chat_saved_object_attributes';

jest.mock('../services/sessions_service', () => {
  return {
    SessionsService: jest.fn().mockImplementation(() => {
      return { reload: jest.fn() };
    }),
  };
});

jest.mock('../services/session_load_service', () => {
  return {
    SessionLoadService: jest.fn().mockImplementation(() => {
      return { load: jest.fn().mockReturnValue({ messages: [], interactions: [] }) };
    }),
  };
});

const INPUT_MESSAGE = {
  type: 'input' as const,
  contentType: 'text' as const,
  content: 'what indices are in my cluster?',
};
const SEND_MESSAGE_RESPONSE = {
  sessionId: 'session_id_mock',
  title: 'title mock',
  messages: [
    { type: 'input', contentType: 'text', content: 'what indices are in my cluster?' },
    { type: 'output', contentType: 'markdown', content: 'here are the indices: .alert' },
  ],
  interactions: [
    {
      input: 'what indices are in my cluster?',
      response: 'here are the indices: .alert',
      conversation_id: 'conversation_id_mock',
      interaction_id: 'interaction_id_mock',
      create_time: '2023-01-01',
    },
  ],
};

describe('useChatActions hook', () => {
  const httpMock = httpServiceMock.createStartContract();
  const chatStateDispatchMock = jest.fn();
  const setFlyoutVisibleMock = jest.fn();
  const setSelectedTabIdMock = jest.fn();
  const pplVisualizationRenderMock = jest.fn();
  const setTraceIdMock = jest.fn();

  const chatContextMock: chatContextHookExports.IChatContext = {
    selectedTabId: 'chat',
    setSessionId: jest.fn(),
    setTitle: jest.fn(),
    setSelectedTabId: setSelectedTabIdMock,
    setFlyoutComponent: jest.fn(),
    setFlyoutVisible: setFlyoutVisibleMock,
    actionExecutors: {
      view_ppl_visualization: pplVisualizationRenderMock,
    },
    setTraceId: setTraceIdMock,
    flyoutVisible: false,
    flyoutFullScreen: false,
    userHasAccess: false,
    contentRenderers: {},
    currentAccount: {
      username: '',
      tenant: '',
    },
  };

  beforeEach(() => {
    jest.spyOn(chatContextHookExports, 'useChatContext').mockReturnValue(chatContextMock);

    jest.spyOn(coreHookExports, 'useCore').mockReturnValue({
      services: {
        http: httpMock,
        sessions: new SessionsService(httpMock),
        sessionLoad: new SessionLoadService(httpMock),
      },
    });

    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: [], interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send message correctly', async () => {
    httpMock.post.mockResolvedValueOnce(SEND_MESSAGE_RESPONSE);
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: {
        messages: [SEND_MESSAGE_RESPONSE.messages[0] as IMessage],
        interactions: [],
        llmResponding: false,
      },
      chatStateDispatch: chatStateDispatchMock,
    });
    const { result } = renderHook(() => useChatActions());
    await result.current.send(INPUT_MESSAGE);

    // it should dispatch `send` action
    expect(chatStateDispatchMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'send' }));

    // it should call send message api
    expect(httpMock.post).toHaveBeenCalledWith(ASSISTANT_API.SEND_MESSAGE, {
      body: JSON.stringify({
        messages: [SEND_MESSAGE_RESPONSE.messages[0]],
        input: INPUT_MESSAGE,
      }),
    });

    // it should send dispatch `receive` action to remove the message without messageId
    expect(chatStateDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'receive', payload: { messages: [], interactions: [] } })
    );

    // it should send dispatch `patch` action
    expect(chatStateDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'patch',
        payload: {
          messages: SEND_MESSAGE_RESPONSE.messages,
          interactions: SEND_MESSAGE_RESPONSE.interactions,
        },
      })
    );
  });

  it('should handle send message error', async () => {
    httpMock.post.mockImplementationOnce(() => {
      throw new Error();
    });
    const { result } = renderHook(() => useChatActions());
    expect(chatStateDispatchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );

    await result.current.send(INPUT_MESSAGE);
    expect(chatStateDispatchMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('should load session by id', async () => {
    const { result } = renderHook(() => useChatActions());
    expect(chatStateDispatchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'receive' })
    );

    await result.current.loadChat('session_id_mock');
    expect(chatStateDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'receive' })
    );
  });

  it('should reset current session if loadChat with no session id', async () => {
    const { result } = renderHook(() => useChatActions());
    expect(chatStateDispatchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reset' })
    );

    await result.current.loadChat();
    expect(chatStateDispatchMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'reset' }));
  });

  it('should open chat UI', () => {
    const { result } = renderHook(() => useChatActions());
    result.current.openChatUI();
    expect(setFlyoutVisibleMock).toHaveBeenCalledWith(true);
    expect(setSelectedTabIdMock).toHaveBeenCalledWith('chat');
  });

  it('should execute `send_as_input` action', async () => {
    const { result } = renderHook(() => useChatActions());
    await result.current.executeAction(
      { actionType: 'send_as_input', message: 'message that send as input' },
      { type: 'output', contentType: 'markdown', content: 'suggested question' }
    );

    // sending message with the suggestion
    expect(httpMock.post).toHaveBeenCalledWith(ASSISTANT_API.SEND_MESSAGE, {
      body: JSON.stringify({
        messages: [],
        input: { type: 'input', content: 'message that send as input', contentType: 'text' },
      }),
    });
  });

  it('should execute `view_in_dashboards` action', () => {
    const originalOpen = window.open;
    const windowOpenMock = jest.fn();
    window.open = windowOpenMock;

    const { result } = renderHook(() => useChatActions());
    result.current.executeAction(
      { actionType: 'view_in_dashboards', message: '' },
      { type: 'output', contentType: 'visualization', content: 'visualization_id_mock' }
    );

    expect(windowOpenMock).toHaveBeenCalledWith(
      `./visualize#/edit/visualization_id_mock`,
      '_blank'
    );
    window.open = originalOpen;
  });

  it('should execute `view_ppl_visualization` action', () => {
    const { result } = renderHook(() => useChatActions());
    result.current.executeAction(
      {
        actionType: 'view_ppl_visualization',
        message: '',
        metadata: { question: 'ppl question mock', query: 'ppl query mock' },
      },
      { type: 'output', contentType: 'markdown', content: 'output markdown mock' }
    );
    expect(pplVisualizationRenderMock).toHaveBeenCalledWith({
      name: 'ppl question mock',
      query: 'ppl query mock',
    });
  });

  it('should execute `view_trace` action', () => {
    const { result } = renderHook(() => useChatActions());
    result.current.executeAction(
      {
        actionType: 'view_trace',
        message: '',
        metadata: { traceId: 'trace_id_mock', icon: '' },
      },
      {
        type: 'output',
        contentType: 'markdown',
        content: 'output markdown mock',
        traceId: 'trace_id_mock',
      }
    );
    expect(setSelectedTabIdMock).toHaveBeenCalledWith('trace');
    expect(setTraceIdMock).toHaveBeenCalledWith('trace_id_mock');
  });

  it('should abort agent execution', async () => {
    const { result } = renderHook(() => useChatActions());
    await result.current.abortAction('session_id_to_abort');
    expect(chatStateDispatchMock).toHaveBeenCalledWith({ type: 'abort' });
    expect(httpMock.post).toHaveBeenCalledWith(ASSISTANT_API.ABORT_AGENT_EXECUTION, {
      body: JSON.stringify({ sessionId: 'session_id_to_abort' }),
    });
  });

  it('should regenerate message', async () => {
    httpMock.put.mockResolvedValue(SEND_MESSAGE_RESPONSE);
    jest
      .spyOn(chatContextHookExports, 'useChatContext')
      .mockReturnValue({ ...chatContextMock, sessionId: 'session_id_mock' });

    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: {
        messages: SEND_MESSAGE_RESPONSE.messages as IMessage[],
        interactions: SEND_MESSAGE_RESPONSE.interactions,
        llmResponding: false,
      },
      chatStateDispatch: chatStateDispatchMock,
    });

    const { result } = renderHook(() => useChatActions());
    await result.current.regenerate('interaction_id_mock');

    expect(chatStateDispatchMock).toHaveBeenCalledWith({ type: 'regenerate' });
    expect(httpMock.put).toHaveBeenCalledWith(ASSISTANT_API.REGENERATE, {
      body: JSON.stringify({
        sessionId: 'session_id_mock',
        interactionId: 'interaction_id_mock',
      }),
    });
    expect(chatStateDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'receive', payload: { messages: [], interactions: [] } })
    );

    expect(chatStateDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'patch',
        payload: {
          messages: SEND_MESSAGE_RESPONSE.messages,
          interactions: SEND_MESSAGE_RESPONSE.interactions,
        },
      })
    );
  });

  it('should not handle regenerate response if the regenerate operation has already aborted', async () => {
    const AbortControllerMock = jest.spyOn(window, 'AbortController').mockImplementation(() => ({
      signal: { aborted: true },
    }));

    httpMock.put.mockResolvedValue(SEND_MESSAGE_RESPONSE);
    jest
      .spyOn(chatContextHookExports, 'useChatContext')
      .mockReturnValue({ ...chatContextMock, sessionId: 'session_id_mock' });

    const { result } = renderHook(() => useChatActions());
    await result.current.regenerate('interaction_id_mock');

    expect(chatStateDispatchMock).toHaveBeenCalledWith({ type: 'regenerate' });
    expect(httpMock.put).toHaveBeenCalledWith(ASSISTANT_API.REGENERATE, {
      body: JSON.stringify({
        sessionId: 'session_id_mock',
        interactionId: 'interaction_id_mock',
      }),
    });
    expect(chatStateDispatchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'receive' })
    );
    AbortControllerMock.mockRestore();
  });

  it('should handle regenerate error', async () => {
    httpMock.put.mockImplementationOnce(() => {
      throw new Error();
    });
    jest
      .spyOn(chatContextHookExports, 'useChatContext')
      .mockReturnValue({ ...chatContextMock, sessionId: 'session_id_mock' });

    const { result } = renderHook(() => useChatActions());
    await result.current.regenerate('interaction_id_mock');

    expect(chatStateDispatchMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('should not handle regenerate error if the regenerate operation has already aborted', async () => {
    const AbortControllerMock = jest.spyOn(window, 'AbortController').mockImplementation(() => ({
      signal: { aborted: true },
    }));
    httpMock.put.mockImplementationOnce(() => {
      throw new Error();
    });
    jest
      .spyOn(chatContextHookExports, 'useChatContext')
      .mockReturnValue({ ...chatContextMock, sessionId: 'session_id_mock' });

    const { result } = renderHook(() => useChatActions());
    await result.current.regenerate('interaction_id_mock');

    expect(chatStateDispatchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
    AbortControllerMock.mockRestore();
  });
});
