/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VizStyleEditor } from './viz_style_editor';

describe('<VizStyleEditor />', () => {
  test('should render visual style editor', () => {
    const onApplyFn = jest.fn();
    render(<VizStyleEditor onApply={onApplyFn} iconType="icon" />);
    expect(screen.queryByText('Edit visual')).toBeInTheDocument();

    // click Edit visual button to open the modal
    expect(screen.queryByTestId('text2vizStyleEditorModal')).toBe(null);
    fireEvent.click(screen.getByText('Edit visual'));
    expect(screen.queryByTestId('text2vizStyleEditorModal')).toBeInTheDocument();

    // Click cancel to close the modal
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('text2vizStyleEditorModal')).toBe(null);

    // Apply button is disabled
    fireEvent.click(screen.getByText('Edit visual'));
    expect(screen.getByTestId('text2vizStyleEditorModalApply')).toBeDisabled();

    // After input text, Apply button is enabled
    fireEvent.input(screen.getByLabelText('Input instructions to tweak the visual'), {
      target: { value: 'test input' },
    });
    expect(screen.getByTestId('text2vizStyleEditorModalApply')).not.toBeDisabled();
    fireEvent.click(screen.getByText('Apply'));
    expect(onApplyFn).toHaveBeenCalledWith('test input');
    expect(screen.queryByTestId('text2vizStyleEditorModal')).toBe(null);
  });

  test('should open the modal with initial value', () => {
    render(<VizStyleEditor onApply={jest.fn()} iconType="icon" value="test input" />);
    fireEvent.click(screen.getByText('Edit visual'));
    expect(screen.getByDisplayValue('test input')).toBeInTheDocument();
  });
});
