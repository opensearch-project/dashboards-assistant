/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../src/core/public/mocks';
import * as coreContextExports from '../../contexts/core_context';

import {
  EditConversationNameModal,
  EditConversationNameModalProps,
} from '../edit_conversation_name_modal';
import { HttpHandler } from '../../../../../src/core/public';

const setup = ({ onClose, defaultTitle, sessionId }: EditConversationNameModalProps) => {
  const useCoreMock = {
    services: coreMock.createStart(),
  };
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(useCoreMock);

  const renderResult = render(
    <I18nProvider>
      <EditConversationNameModal
        onClose={onClose}
        sessionId={sessionId}
        defaultTitle={defaultTitle}
      />
    </I18nProvider>
  );

  return {
    useCoreMock,
    renderResult,
  };
};

describe('<EditConversationNameModal />', () => {
  it('should render default title in name input', async () => {
    const { renderResult } = setup({
      sessionId: '1',
      defaultTitle: 'foo',
    });

    await waitFor(async () => {
      expect(renderResult.getByLabelText('Conversation name input').getAttribute('value')).toBe(
        'foo'
      );
    });
  });

  it('should call onClose with "canceled" after cancel button click', async () => {
    const onCloseMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      sessionId: '1',
      defaultTitle: 'foo',
      onClose: onCloseMock,
    });

    fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
      target: {
        value: 'bar',
      },
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalCancelButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('cancelled');
    });
  });

  it('should show success toast and call onClose with "updated" after patch session succeed', async () => {
    const onCloseMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      sessionId: '1',
      defaultTitle: 'foo',
      onClose: onCloseMock,
    });
    useCoreMock.services.http.put.mockImplementation(() => Promise.resolve());

    fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
      target: {
        value: 'bar',
      },
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('updated', 'bar');
      expect(useCoreMock.services.notifications.toasts.addSuccess).toHaveBeenLastCalledWith(
        'This conversation was successfully updated.'
      );
    });
  });

  it('should show error toasts and call onClose with "errored" after failed patch session', async () => {
    const onCloseMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      sessionId: '1',
      defaultTitle: 'foo',
      onClose: onCloseMock,
    });
    useCoreMock.services.http.put.mockImplementation(() => Promise.reject(new Error()));

    fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
      target: {
        value: 'bar',
      },
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('errored');
      expect(useCoreMock.services.notifications.toasts.addDanger).toHaveBeenLastCalledWith(
        'There was an error. The name failed to update.'
      );
    });
  });

  it('should call onClose with cancelled after patch session aborted', async () => {
    const onCloseMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      sessionId: '1',
      defaultTitle: 'foo',
      onClose: onCloseMock,
    });
    useCoreMock.services.http.put.mockImplementation(((_path, options) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.onabort = () => {
            reject(new Error('Aborted'));
          };
        }
      });
    }) as HttpHandler);

    fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
      target: {
        value: 'bar',
      },
    });

    expect(onCloseMock).not.toHaveBeenCalled();
    expect(useCoreMock.services.http.put).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    expect(useCoreMock.services.http.put).toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalCancelButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('cancelled');
      expect(useCoreMock.services.notifications.toasts.addSuccess).not.toHaveBeenCalled();
      expect(useCoreMock.services.notifications.toasts.addDanger).not.toHaveBeenCalled();
      expect(useCoreMock.services.notifications.toasts.addError).not.toHaveBeenCalled();
    });
  });
});
