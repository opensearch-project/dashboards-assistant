/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';

import { useChatState, ChatStateProvider } from './use_chat_state';

describe('useChatState hook', () => {
  it('should have initial chat state', () => {
    const { result } = renderHook(() => useChatState(), { wrapper: ChatStateProvider });
    expect(result.current.chatState).toEqual({
      interactions: [],
      messages: [],
      llmResponding: false,
    });
  });

  it('should update state after `send`', () => {
    const { result } = renderHook(() => useChatState(), { wrapper: ChatStateProvider });
    act(() => {
      result.current.chatStateDispatch({
        type: 'send',
        payload: { type: 'input', contentType: 'text', content: 'question mock' },
      });
    });
    expect(result.current.chatState.llmResponding).toBe(true);
    expect(result.current.chatState.messages).toEqual([
      { type: 'input', contentType: 'text', content: 'question mock' },
    ]);
  });

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useChatState(), { wrapper: ChatStateProvider });
    act(() => {
      result.current.chatStateDispatch({
        type: 'send',
        payload: { type: 'input', contentType: 'text', content: 'question mock' },
      });
    });
    expect(result.current.chatState.llmResponding).toBe(true);
    expect(result.current.chatState.messages).toEqual([
      { type: 'input', contentType: 'text', content: 'question mock' },
    ]);

    act(() => {
      result.current.chatStateDispatch({
        type: 'reset',
      });
    });
    expect(result.current.chatState).toEqual({
      interactions: [],
      messages: [],
      llmResponding: false,
    });
  });

  it('should update state after `receive`', () => {
    const { result } = renderHook(() => useChatState(), { wrapper: ChatStateProvider });
    act(() => {
      result.current.chatStateDispatch({
        type: 'send',
        payload: { type: 'input', contentType: 'text', content: 'question mock' },
      });
    });
    expect(result.current.chatState.llmResponding).toBe(true);
    expect(result.current.chatState.messages).toEqual([
      { type: 'input', contentType: 'text', content: 'question mock' },
    ]);
    expect(result.current.chatState.interactions).toEqual([]);

    act(() =>
      result.current.chatStateDispatch({
        type: 'receive',
        payload: {
          messages: [
            { type: 'input', contentType: 'text', content: 'question mock' },
            { type: 'output', contentType: 'markdown', content: 'output mock' },
          ],
          interactions: [
            {
              input: 'question mock',
              response: 'output mock',
              conversation_id: 'conversation_id_mock',
              interaction_id: 'interaction_id_mock',
              create_time: new Date('2023-01-02').toLocaleString(),
            },
          ],
        },
      })
    );

    expect(result.current.chatState.llmResponding).toBe(false);
    expect(result.current.chatState.messages).toEqual([
      { type: 'input', contentType: 'text', content: 'question mock' },
      { type: 'output', contentType: 'markdown', content: 'output mock' },
    ]);
    expect(result.current.chatState.interactions).toEqual([
      {
        input: 'question mock',
        response: 'output mock',
        conversation_id: 'conversation_id_mock',
        interaction_id: 'interaction_id_mock',
        create_time: new Date('2023-01-02').toLocaleString(),
      },
    ]);
  });

  it('should update state after `error`', () => {
    const { result } = renderHook(() => useChatState(), { wrapper: ChatStateProvider });
    act(() => {
      result.current.chatStateDispatch({
        type: 'send',
        payload: { type: 'input', contentType: 'text', content: 'question mock' },
      });
    });
    expect(result.current.chatState.llmResponding).toBe(true);
    expect(result.current.chatState.llmError).toBeUndefined();

    // when payload is an error object
    const errorMock1 = new Error();
    act(() => result.current.chatStateDispatch({ type: 'error', payload: errorMock1 }));
    expect(result.current.chatState.llmResponding).toBe(false);
    expect(result.current.chatState.llmError).toEqual(errorMock1);

    // when payload is an object of {body: Error}
    const errorMock2 = new Error();
    act(() => result.current.chatStateDispatch({ type: 'error', payload: { body: errorMock2 } }));
    expect(result.current.chatState.llmResponding).toBe(false);
    expect(result.current.chatState.llmError).toEqual(errorMock2);

    // send another message should clear error state
    act(() => {
      result.current.chatStateDispatch({
        type: 'send',
        payload: { type: 'input', contentType: 'text', content: 'another question mock' },
      });
    });
    expect(result.current.chatState.llmError).toBeUndefined();
  });

  it('should update state after `abort`', () => {
    const { result } = renderHook(() => useChatState(), { wrapper: ChatStateProvider });
    act(() => {
      result.current.chatStateDispatch({
        type: 'send',
        payload: { type: 'input', contentType: 'text', content: 'question mock' },
      });
    });
    expect(result.current.chatState.llmResponding).toBe(true);

    act(() => result.current.chatStateDispatch({ type: 'abort' }));
    expect(result.current.chatState.llmResponding).toBe(false);
  });

  it('should update state after `regenerate`', () => {
    const { result } = renderHook(() => useChatState(), { wrapper: ChatStateProvider });
    act(() =>
      result.current.chatStateDispatch({
        type: 'receive',
        payload: {
          messages: [
            { type: 'input', contentType: 'text', content: 'question mock' },
            { type: 'output', contentType: 'markdown', content: 'output mock' },
          ],
          interactions: [
            {
              input: 'question mock',
              response: 'output mock',
              conversation_id: 'conversation_id_mock',
              interaction_id: 'interaction_id_mock',
              create_time: new Date().toLocaleString(),
            },
          ],
        },
      })
    );

    expect(result.current.chatState.llmResponding).toBe(false);
    expect(result.current.chatState.messages).toEqual([
      { type: 'input', contentType: 'text', content: 'question mock' },
      { type: 'output', contentType: 'markdown', content: 'output mock' },
    ]);

    act(() => result.current.chatStateDispatch({ type: 'regenerate' }));
    expect(result.current.chatState.llmResponding).toBe(true);
    expect(result.current.chatState.messages).toEqual([
      { type: 'input', contentType: 'text', content: 'question mock' },
    ]);
  });
});
