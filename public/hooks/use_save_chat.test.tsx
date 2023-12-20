/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { NOTEBOOK_API } from '../../common/constants/llm';

import { useSaveChat } from './use_save_chat';
import * as chatStateHookExports from './use_chat_state';
import * as coreHookExports from '../contexts/core_context';
import { httpServiceMock } from '../../../../src/core/public/mocks';
import * as chatContextHookExports from '../contexts/chat_context';

describe('useSaveChat hook', () => {
  const chatName = 'foo';
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

  it('should throw error if createNotebook function does not return id', async () => {
    httpMock.post.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useSaveChat());
    const saveChat = result.current.saveChat;
    let saveChatError;
    try {
      await saveChat(chatName);
    } catch (e) {
      saveChatError = e;
    }
    expect(httpMock.post).toHaveBeenCalledWith(NOTEBOOK_API.CREATE_NOTEBOOK, {
      body: JSON.stringify({ name: chatName }),
    });
    expect(saveChatError?.message).toBe('create notebook error');
  });

  it('should use the id which createNotebook returned to pass to setParagraphs function and throw error if set paragraphs function does not return object id', async () => {
    const mockId = 'id';

    httpMock.post.mockImplementation((path) => {
      return new Promise((resolve) => {
        if (((path as unknown) as string) === NOTEBOOK_API.CREATE_NOTEBOOK) {
          resolve(mockId);
        } else {
          resolve({ objectId: undefined });
        }
      });
    });

    const { result } = renderHook(() => useSaveChat());
    const saveChat = result.current.saveChat;
    let saveChatError;
    try {
      await saveChat(chatName);
    } catch (e) {
      saveChatError = e;
    }
    expect(httpMock.post).toHaveBeenCalledWith(NOTEBOOK_API.CREATE_NOTEBOOK, {
      body: JSON.stringify({ name: chatName }),
    });
    expect(httpMock.post).toHaveBeenCalledWith(NOTEBOOK_API.SET_PARAGRAPH, {
      body: JSON.stringify({ noteId: mockId, paragraphs: [] }),
    });
    expect(saveChatError.message).toBe('set paragraphs error');
  });

  it('should use the id which createNotebook returned to pass to setParagraphs function and run regularly ', async () => {
    const mockId = 'id';

    httpMock.post.mockImplementation((path) => {
      return new Promise((resolve) => {
        if (((path as unknown) as string) === NOTEBOOK_API.CREATE_NOTEBOOK) {
          resolve(mockId);
        } else {
          resolve({ objectId: mockId });
        }
      });
    });

    const { result } = renderHook(() => useSaveChat());
    const saveChat = result.current.saveChat;

    await saveChat(chatName);

    expect(httpMock.post).toHaveBeenCalledWith(NOTEBOOK_API.CREATE_NOTEBOOK, {
      body: JSON.stringify({ name: chatName }),
    });
    expect(httpMock.post).toHaveBeenCalledWith(NOTEBOOK_API.SET_PARAGRAPH, {
      body: JSON.stringify({ noteId: mockId, paragraphs: [] }),
    });
  });
});
