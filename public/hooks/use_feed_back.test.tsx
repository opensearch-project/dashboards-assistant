/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';

import { useFeedback } from './use_feed_back';
import * as chatStateHookExports from './use_chat_state';
import * as coreHookExports from '../contexts/core_context';
import { httpServiceMock } from '../../../../src/core/public/mocks';
import * as chatContextHookExports from '../contexts/chat_context';
import { Interaction, IOutput, IMessage } from '../../common/types/chat_saved_object_attributes';
import { ASSISTANT_API } from '../../common/constants/llm';

describe('useFeedback hook', () => {
  const httpMock = httpServiceMock.createStartContract();
  const chatStateDispatchMock = jest.fn();

  const chatContextMock = {
    rootAgentId: 'root_agent_id_mock',
    selectedTabId: 'chat',
    setSessionId: jest.fn(),
    setTitle: jest.fn(),
    currentAccount: { username: 'admin' },
  };

  beforeEach(() => {
    jest.spyOn(coreHookExports, 'useCore').mockReturnValue({
      services: {
        http: httpMock,
      },
    });
    jest.spyOn(chatContextHookExports, 'useChatContext').mockReturnValue(chatContextMock);

    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: [], interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set state if passed with initial feedback state', () => {
    const mockInteraction = {
      additional_info: { feedback: { satisfaction: true } },
    } as Interaction;
    const { result } = renderHook(() => useFeedback(mockInteraction));
    expect(result.current.feedbackResult).toBe(true);
  });

  it('should have an undefined state if not passed with initial feedback state', () => {
    const { result } = renderHook(() => useFeedback());
    expect(result.current.feedbackResult).toBe(undefined);
  });

  it('should call feedback api regularly with passed correct value and set feedback state if call API success', async () => {
    const mockInputMessage = {
      type: 'input',
    } as IMessage;
    const mockOutputMessage = {
      type: 'output',
      traceId: 'traceId',
    } as IOutput;
    const mockMessages = [mockInputMessage, mockOutputMessage];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: mockMessages, interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
    const { result, waitForNextUpdate } = renderHook(() => useFeedback());
    expect(result.current.feedbackResult).toBe(undefined);

    const sendFeedback = result.current.sendFeedback;
    await sendFeedback(mockOutputMessage as IOutput, true);
    expect(httpMock.put).toHaveBeenCalledWith(
      `${ASSISTANT_API.FEEDBACK}/${mockOutputMessage.traceId}`,
      {
        body: JSON.stringify({
          satisfaction: true,
        }),
      }
    );
    waitForNextUpdate();
    expect(result.current.feedbackResult).toBe(true);
  });

  it('should not update feedback state if API fail', async () => {
    httpMock.put.mockRejectedValueOnce(new Error(''));

    const mockInputMessage = {
      type: 'input',
    } as IMessage;
    const mockOutputMessage = {
      type: 'output',
      traceId: 'traceId',
    } as IOutput;
    const mockMessages = [mockInputMessage, mockOutputMessage];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: mockMessages, interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
    const { result, waitForNextUpdate } = renderHook(() => useFeedback());
    expect(result.current.feedbackResult).toBe(undefined);

    const sendFeedback = result.current.sendFeedback;

    await sendFeedback(mockOutputMessage as IOutput, true);

    expect(httpMock.put).toHaveBeenCalledWith(
      `${ASSISTANT_API.FEEDBACK}/${mockOutputMessage.traceId}`,
      {
        body: JSON.stringify({
          satisfaction: true,
        }),
      }
    );
    waitForNextUpdate();
    expect(result.current.feedbackResult).toBe(undefined);
  });
});
