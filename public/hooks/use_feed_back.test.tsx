/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useFeedback } from './use_feed_back';
import * as chatStateHookExports from './use_chat_state';
import { Interaction, IOutput, IMessage } from '../../common/types/chat_saved_object_attributes';
import { getIncontextInsightRegistry } from '../services';

jest.mock('../services');

describe('useFeedback hook', () => {
  let registryMock: unknown;
  const chatStateDispatchMock = jest.fn();

  beforeEach(() => {
    registryMock = {
      sendFeedbackRequest: jest.fn(),
      on: jest.fn(),
    };

    (getIncontextInsightRegistry as jest.Mock).mockReturnValue(registryMock);

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
    const mockInteraction = {
      interaction_id: 'interactionId',
    } as Interaction;
    const mockInputMessage = {
      type: 'input',
    } as IMessage;
    const mockOutputMessage = {
      type: 'output',
      interactionId: 'interactionId',
    } as IOutput;
    const mockMessages = [mockInputMessage, mockOutputMessage];
    const correct = true;
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: mockMessages, interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
    const { result } = renderHook(() => useFeedback(mockInteraction));
    expect(result.current.feedbackResult).toBe(undefined);

    const sendFeedback = result.current.sendFeedback;
    await act(async () => {
      await sendFeedback(mockOutputMessage, correct);
    });
    act(() => {
      registryMock.on.mock.calls.forEach(([event, handler]) => {
        if (event === `feedbackSuccess:${mockOutputMessage.interactionId}`) {
          handler({ correct });
        }
      });
    });
    expect(registryMock.sendFeedbackRequest).toHaveBeenCalledWith(
      mockOutputMessage.interactionId,
      correct
    );
    expect(result.current.feedbackResult).toBe(correct);
  });

  it('should not update feedback state if API fail', async () => {
    const mockInputMessage = {
      type: 'input',
    } as IMessage;
    const mockOutputMessage = {
      type: 'output',
      interactionId: 'interactionId',
    } as IOutput;
    const mockMessages = [mockInputMessage, mockOutputMessage];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: mockMessages, interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
    const { result } = renderHook(() => useFeedback());
    expect(result.current.feedbackResult).toBe(undefined);

    const sendFeedback = result.current.sendFeedback;
    await act(async () => {
      await sendFeedback(mockOutputMessage, true);
    });

    expect(result.current.feedbackResult).toBe(undefined);
  });

  it('should call feedback request on registry without checking for input message if hasChatState is false', async () => {
    const mockOutputMessage = {
      type: 'output',
      interactionId: 'interactionId',
    } as IOutput;
    const mockInteraction = {
      interaction_id: 'interactionId',
    } as Interaction;

    const { result } = renderHook(() => useFeedback(mockInteraction, false));
    expect(result.current.feedbackResult).toBe(undefined);

    const sendFeedback = result.current.sendFeedback;
    await act(async () => {
      await sendFeedback(mockOutputMessage, false);
    });
    act(() => {
      registryMock.on.mock.calls.forEach(([event, handler]) => {
        if (event === `feedbackSuccess:${mockOutputMessage.interactionId}`) {
          handler({ correct: false });
        }
      });
    });
    expect(registryMock.sendFeedbackRequest).toHaveBeenCalledWith(
      mockOutputMessage.interactionId,
      false
    );
    expect(result.current.feedbackResult).toBe(false);
  });
});
