/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../../src/core/public/mocks';
import * as coreContextExports from '../../../contexts/core_context';

import {
  DeleteConversationConfirmModal,
  DeleteConversationConfirmModalProps,
} from '../delete_conversation_confirm_modal';
import { HttpHandler } from '../../../../../../src/core/public';
import { DataSourceServiceMock } from '../../../services/data_source_service.mock';

const setup = ({ onClose, conversationId }: DeleteConversationConfirmModalProps) => {
  const dataSourceServiceMock = new DataSourceServiceMock();

  const useCoreMock = {
    services: { ...coreMock.createStart(), dataSource: dataSourceServiceMock },
  };
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(useCoreMock);

  const renderResult = render(
    <I18nProvider>
      <DeleteConversationConfirmModal onClose={onClose} conversationId={conversationId} />
    </I18nProvider>
  );

  return {
    useCoreMock,
    renderResult,
  };
};

describe('<DeleteConversationConfirmModal />', () => {
  it('should render confirm text and button', async () => {
    const { renderResult } = setup({
      conversationId: '1',
    });

    await waitFor(async () => {
      expect(
        renderResult.getByText(
          'Are you sure you want to delete the conversation? After it’s deleted, the conversation details will not be accessible.'
        )
      ).toBeTruthy();
      expect(renderResult.getByRole('button', { name: 'Delete conversation' })).toBeTruthy();
      expect(renderResult.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    });
  });

  it('should call onClose with "canceled" after cancel button click', async () => {
    const onCloseMock = jest.fn();
    const { renderResult } = setup({
      conversationId: '1',
      onClose: onCloseMock,
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalCancelButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('cancelled');
    });
  });

  it('should show success toast and call onClose with "deleted" after delete conversation succeed', async () => {
    const onCloseMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      conversationId: '1',
      onClose: onCloseMock,
    });
    useCoreMock.services.http.delete.mockImplementation(() => Promise.resolve());

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('deleted');
      expect(useCoreMock.services.notifications.toasts.addSuccess).toHaveBeenLastCalledWith(
        'The conversation was successfully deleted.'
      );
    });
  });

  it('should show error toasts and call onClose with "errored" after delete conversation failed', async () => {
    const onCloseMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      conversationId: '1',
      onClose: onCloseMock,
    });
    useCoreMock.services.http.delete.mockImplementation(() => Promise.reject(new Error()));

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('errored');
    });
  });

  it('should call onClose with cancelled after delete conversation aborted', async () => {
    const onCloseMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      conversationId: '1',
      onClose: onCloseMock,
    });
    useCoreMock.services.http.delete.mockImplementation(((_path, options) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.onabort = () => {
            reject(new Error('Aborted'));
          };
        }
      });
    }) as HttpHandler);

    expect(onCloseMock).not.toHaveBeenCalled();
    expect(useCoreMock.services.http.delete).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    expect(useCoreMock.services.http.delete).toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalCancelButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenLastCalledWith('cancelled');
      expect(useCoreMock.services.notifications.toasts.addSuccess).not.toHaveBeenCalled();
      expect(useCoreMock.services.notifications.toasts.addDanger).not.toHaveBeenCalled();
      expect(useCoreMock.services.notifications.toasts.addError).not.toHaveBeenCalled();
    });
  });
});
