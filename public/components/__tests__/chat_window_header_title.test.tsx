/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../src/core/public/mocks';
import * as useChatStateExports from '../../hooks/use_chat_state';
import * as useChatActionsExports from '../../hooks/use_chat_actions';
import * as useSaveChatExports from '../../hooks/use_save_chat';
import * as chatContextExports from '../../contexts/chat_context';
import * as coreContextExports from '../../contexts/core_context';
import { IMessage } from '../../../common/types/chat_saved_object_attributes';

import { ChatWindowHeaderTitle } from '../chat_window_header_title';

const setup = ({
  messages = [],
  ...rest
}: { messages?: IMessage[]; conversationId?: string | undefined } = {}) => {
  const useCoreMock = {
    services: {
      ...coreMock.createStart(),
      conversations: {
        conversations$: new BehaviorSubject({
          objects: [
            {
              id: '1',
              title: 'foo',
            },
          ],
          total: 1,
        }),
        reload: jest.fn(),
      },
    },
  };
  useCoreMock.services.http.put.mockImplementation(() => Promise.resolve());

  const useChatStateMock = {
    chatState: { messages },
  };
  const useChatContextMock = {
    conversationId: 'conversationId' in rest ? rest.conversationId : '1',
    title: 'foo',
    setConversationId: jest.fn(),
    setTitle: jest.fn(),
  };
  const useChatActionsMock = {
    loadChat: jest.fn(),
  };
  const useSaveChatMock = {
    saveChat: jest.fn(),
  };
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(useCoreMock);
  jest.spyOn(useChatStateExports, 'useChatState').mockReturnValue(useChatStateMock);
  jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue(useChatContextMock);
  jest.spyOn(useChatActionsExports, 'useChatActions').mockReturnValue(useChatActionsMock);
  jest.spyOn(useSaveChatExports, 'useSaveChat').mockReturnValue(useSaveChatMock);

  const renderResult = render(
    <I18nProvider>
      <ChatWindowHeaderTitle />
    </I18nProvider>
  );

  return {
    useCoreMock,
    useChatStateMock,
    useChatContextMock,
    useChatActionsMock,
    renderResult,
  };
};

describe('<ChatWindowHeaderTitle />', () => {
  it('should reload history list after edit conversation name', async () => {
    const { renderResult, useCoreMock } = setup();

    fireEvent.click(renderResult.getByText('foo'));
    fireEvent.click(renderResult.getByText('Rename conversation'));
    fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
      target: { value: 'bar' },
    });

    expect(useCoreMock.services.conversations.reload).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    await waitFor(() => {
      expect(useCoreMock.services.conversations.reload).toHaveBeenCalled();
    });
  });

  it('should show "Rename conversation", "New conversation" and "Save to notebook" actions after title click', () => {
    const { renderResult } = setup();

    expect(
      renderResult.queryByRole('button', { name: 'Rename conversation' })
    ).not.toBeInTheDocument();
    expect(
      renderResult.queryByRole('button', { name: 'New conversation' })
    ).not.toBeInTheDocument();
    expect(
      renderResult.queryByRole('button', { name: 'Save to notebook' })
    ).not.toBeInTheDocument();

    fireEvent.click(renderResult.getByText('foo'));

    expect(renderResult.getByRole('button', { name: 'Rename conversation' })).toBeInTheDocument();
    expect(renderResult.getByRole('button', { name: 'New conversation' })).toBeInTheDocument();
    expect(renderResult.getByRole('button', { name: 'Save to notebook' })).toBeInTheDocument();
  });

  it('should show rename modal and hide rename actions after rename button clicked', async () => {
    const { renderResult } = setup();

    fireEvent.click(renderResult.getByText('foo'));
    fireEvent.click(renderResult.getByRole('button', { name: 'Rename conversation' }));

    await waitFor(() => {
      expect(renderResult.getByText('Edit conversation name')).toBeInTheDocument();
      expect(
        renderResult.queryByRole('button', { name: 'Rename conversation' })
      ).not.toBeInTheDocument();
    });
  });

  it('should call loadChat with undefined, hide actions and show success toasts after new conversation button clicked', async () => {
    const { renderResult, useCoreMock, useChatActionsMock } = setup();

    fireEvent.click(renderResult.getByText('foo'));

    expect(useChatActionsMock.loadChat).not.toHaveBeenCalled();
    expect(useCoreMock.services.notifications.toasts.addSuccess).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByRole('button', { name: 'New conversation' }));

    await waitFor(() => {
      expect(useChatActionsMock.loadChat).toHaveBeenCalledWith(undefined);
      expect(
        renderResult.queryByRole('button', { name: 'New conversation' })
      ).not.toBeInTheDocument();
      expect(useCoreMock.services.notifications.toasts.addSuccess).toHaveBeenCalledWith(
        'A new conversation is started and the previous one is saved.'
      );
    });
  });

  it('should show save to notebook modal after "Save to notebook" clicked', async () => {
    const { renderResult } = setup();

    fireEvent.click(renderResult.getByText('foo'));
    fireEvent.click(renderResult.getByRole('button', { name: 'Save to notebook' }));

    await waitFor(() => {
      expect(renderResult.queryByText('Save to notebook')).toBeInTheDocument();
    });
  });

  it('should disable "Save to notebook" button when message does not include input', async () => {
    const { renderResult } = setup({
      messages: [{ type: 'output', content: 'bar', contentType: 'markdown' }],
    });

    fireEvent.click(renderResult.getByText('foo'));

    expect(renderResult.getByRole('button', { name: 'Save to notebook' })).toBeDisabled();
  });

  it('should show "OpenSearch Assistant" when conversationId is undefined', async () => {
    const { renderResult } = setup({
      conversationId: undefined,
    });

    expect(renderResult.getByText('OpenSearch Assistant')).toBeInTheDocument();
  });
});
