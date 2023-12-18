/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../../src/core/public/mocks';
import * as coreContextExports from '../../../contexts/core_context';

import { NotebookNameModal, NotebookNameModalProps } from '../notebook_name_modal';
import { AssistantServices } from '../../../contexts/core_context';
import { OpenSearchDashboardsReactContextValue } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

const setup = ({ onClose, saveChat }: NotebookNameModalProps) => {
  const useCoreMock = {
    services: coreMock.createStart(),
  };
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(
    // In test env, only mock needed core service and assert.
    (useCoreMock as unknown) as OpenSearchDashboardsReactContextValue<AssistantServices>
  );

  const renderResult = render(
    <I18nProvider>
      <NotebookNameModal onClose={onClose} saveChat={saveChat} />
    </I18nProvider>
  );

  return {
    useCoreMock,
    renderResult,
  };
};

describe('<NotebookNameModal />', () => {
  it('should call onClose after cancel button click', async () => {
    const onCloseMock = jest.fn();
    const saveChatMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      onClose: onCloseMock,
      saveChat: saveChatMock,
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('cancelSaveToNotebookButton'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('should show success toast and call onClose after saving chat succeed', async () => {
    const onCloseMock = jest.fn();
    const saveChatMock = jest.fn();
    const { renderResult, useCoreMock } = setup({
      onClose: onCloseMock,
      saveChat: saveChatMock,
    });

    fireEvent.change(renderResult.getByLabelText('Notebook name input'), {
      target: {
        value: 'notebook-name',
      },
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmSaveToNotebookButton'));

    await waitFor(() => {
      expect(useCoreMock.services.notifications.toasts.addSuccess).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('should show error toasts and call onClose after failed save chat', async () => {
    const onCloseMock = jest.fn();
    const saveChatMock = jest.fn(() => {
      throw new Error();
    });
    const { renderResult, useCoreMock } = setup({
      onClose: onCloseMock,
      saveChat: saveChatMock,
    });

    fireEvent.change(renderResult.getByLabelText('Notebook name input'), {
      target: {
        value: 'notebook-name',
      },
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmSaveToNotebookButton'));

    await waitFor(() => {
      expect(useCoreMock.services.notifications.toasts.addDanger).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('should show observability dependency toasts and call onClose after not found error', async () => {
    const onCloseMock = jest.fn();
    const saveChatMock = jest.fn(() => {
      throw new Error('Not Found');
    });
    const { renderResult, useCoreMock } = setup({
      onClose: onCloseMock,
      saveChat: saveChatMock,
    });

    fireEvent.change(renderResult.getByLabelText('Notebook name input'), {
      target: {
        value: 'notebook-name',
      },
    });

    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmSaveToNotebookButton'));

    await waitFor(() => {
      expect(useCoreMock.services.notifications.toasts.addDanger).toHaveBeenCalledWith(
        'This feature depends on the observability plugin, please install it before use.'
      );
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
