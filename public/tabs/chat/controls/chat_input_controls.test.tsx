/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, getByRole } from '@testing-library/react';

import { ChatInputControls } from './chat_input_controls';
import * as contextExports from '../../../contexts/chat_context';
import * as hookExports from '../../../hooks/use_chat_actions';

describe('<ChatInputControls />', () => {
  const sendMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(contextExports, 'useChatContext').mockReturnValue({
      appId: 'mocked_app_id',
    });
    jest.spyOn(hookExports, 'useChatActions').mockReturnValue({
      send: sendMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display submit button and text box in different state accordingly', () => {
    const { rerender } = render(<ChatInputControls loading={true} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Generating...');

    rerender(<ChatInputControls loading={false} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Go');

    rerender(<ChatInputControls loading={true} disabled={false} />);
    expect(screen.getByRole('button')).toBeEnabled();
    expect(screen.getByRole('textbox')).toBeEnabled();
    expect(screen.getByRole('button')).toHaveTextContent('Generating...');

    rerender(<ChatInputControls loading={false} disabled={false} />);
    expect(screen.getByRole('button')).toBeEnabled();
    expect(screen.getByRole('textbox')).toBeEnabled();
    expect(screen.getByRole('button')).toHaveTextContent('Go');
  });

  it('should send message when clicking submit button', () => {
    render(<ChatInputControls loading={false} disabled={false} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'what indices are in my cluster?' },
    });
    fireEvent.click(screen.getByRole('button'));
    expect(sendMock).toHaveBeenCalledWith({
      type: 'input',
      content: 'what indices are in my cluster?',
      contentType: 'text',
      context: {
        appId: 'mocked_app_id',
      },
    });
  });

  it('should send message when pressing `Enter`', () => {
    render(<ChatInputControls loading={false} disabled={false} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'what indices are in my cluster?' },
    });
    fireEvent.keyPress(screen.getByRole('textbox'), {
      key: 'Enter',
      keyCode: 13,
      shiftKey: false,
    });
    expect(sendMock).toHaveBeenCalledWith({
      type: 'input',
      content: 'what indices are in my cluster?',
      contentType: 'text',
      context: {
        appId: 'mocked_app_id',
      },
    });
  });

  it('should NOT send message when pressing `shift+Enter`', () => {
    render(<ChatInputControls loading={false} disabled={false} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'what indices are in my cluster?' },
    });
    fireEvent.keyPress(screen.getByRole('textbox'), {
      key: 'Enter',
      keyCode: 13,
      shiftKey: true,
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('should NOT send message if disabled', () => {
    render(<ChatInputControls loading={false} disabled={true} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'what indices are in my cluster?' },
    });
    fireEvent.click(screen.getByRole('button'));
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('should NOT send message if input is trimmed empty', () => {
    render(<ChatInputControls loading={false} disabled={false} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: ' ' },
    });
    fireEvent.click(screen.getByRole('button'));
    expect(sendMock).not.toHaveBeenCalled();
  });
});
