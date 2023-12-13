/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';

import { ChatExperimentalBadge } from '../chat_experimental_badge';

describe('<ChatWindowHeaderTitle />', () => {
  it('should show experimental dropdown after icon clicked', () => {
    const { getByRole, getByText, queryByText } = render(
      <I18nProvider>
        <ChatExperimentalBadge />
      </I18nProvider>
    );

    expect(queryByText('Experimental')).not.toBeInTheDocument();
    fireEvent.click(getByRole('button'));
    expect(getByText('Experimental')).toBeInTheDocument();
  });

  it('should hide experimental dropdown after click other places', async () => {
    const { getByRole, getByText, queryByText } = render(
      <I18nProvider>
        <ChatExperimentalBadge />
      </I18nProvider>
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      expect(getByText('Experimental')).toBeInTheDocument();

      // Ensure focus trap enabled, then we can click outside.
      expect(
        getByText('Experimental').closest('div[data-focus-lock-disabled="false"]')
      ).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(queryByText('Experimental')).not.toBeInTheDocument();
    });
  });
});
