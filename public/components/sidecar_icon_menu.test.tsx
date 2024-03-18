/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render, screen } from '@testing-library/react';
import { SidecarIconMenu } from './sidecar_icon_menu';
import * as chatContextExports from './../contexts/chat_context';
import { SIDECAR_DOCKED_MODE } from '../../../../src/core/public';
import * as coreContextExports from '../contexts/core_context';
import {
  DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
  DEFAULT_SIDECAR_TAKEOVER_PADDING_TOP_SIZE,
} from '../utils/constants';

const setSidecarDockedMode = jest.fn();
const setSidecarConfig = jest.fn();

const setup = (sidecarDockedMode = SIDECAR_DOCKED_MODE.RIGHT) => {
  const useChatContextMock = {
    conversationId: '1',
    title: 'foo',
    setConversationId: jest.fn(),
    setTitle: jest.fn(),
    setFlyoutVisible: jest.fn(),
    setSelectedTabId: jest.fn(),
    setFlyoutComponent: jest.fn(),
    sidecarDockedMode,
    setSidecarDockedMode,
  };
  jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue(useChatContextMock);

  jest.spyOn(coreContextExports, 'useCore').mockReturnValue({
    overlays: {
      sidecar: () => {
        return {
          setSidecarConfig,
        };
      },
    },
  });

  const renderResult = render(<SidecarIconMenu />);

  return {
    renderResult,
    useChatContextMock,
  };
};

describe('<SidecarIconMenu/> spec', () => {
  it('renders the component', async () => {
    setup();
    expect(document.body.children).toMatchSnapshot();
  });

  it('clicks icon and set a new mode', async () => {
    setup();
    const icon = screen.getByLabelText('setSidecarMode');
    fireEvent.click(icon);
    const leftIcon = screen.getByTestId('sidecar-mode-icon-menu-item-left');
    fireEvent.click(leftIcon);
    expect(setSidecarConfig).toHaveBeenCalledWith({
      dockedMode: SIDECAR_DOCKED_MODE.LEFT,
    });
    expect(setSidecarDockedMode).toHaveBeenCalledWith(SIDECAR_DOCKED_MODE.LEFT);
  });

  it('set same mode will return', async () => {
    setup();
    const icon = screen.getByLabelText('setSidecarMode');
    fireEvent.click(icon);
    const rightIcon = screen.getByTestId('sidecar-mode-icon-menu-item-right');
    fireEvent.click(rightIcon);
    expect(setSidecarDockedMode).not.toHaveBeenCalled();
  });

  it('set takeover mode will set a new default size based on window', async () => {
    setup();
    const icon = screen.getByLabelText('setSidecarMode');
    fireEvent.click(icon);
    const takeoverIcon = screen.getByTestId('sidecar-mode-icon-menu-item-takeover');
    fireEvent.click(takeoverIcon);
    const defaultTakeOverSize = window.innerHeight - DEFAULT_SIDECAR_TAKEOVER_PADDING_TOP_SIZE;
    expect(setSidecarConfig).toHaveBeenCalledWith({
      dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
      paddingSize: defaultTakeOverSize,
    });
    expect(setSidecarDockedMode).toHaveBeenCalledWith(SIDECAR_DOCKED_MODE.TAKEOVER);
  });

  it('set default left or right size when switching from takeover', async () => {
    setup(SIDECAR_DOCKED_MODE.TAKEOVER);
    const icon = screen.getByLabelText('setSidecarMode');
    fireEvent.click(icon);
    const leftIcon = screen.getByTestId('sidecar-mode-icon-menu-item-left');
    fireEvent.click(leftIcon);
    expect(setSidecarConfig).toHaveBeenCalledWith({
      dockedMode: SIDECAR_DOCKED_MODE.LEFT,
      paddingSize: DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE,
    });
    expect(setSidecarDockedMode).toHaveBeenCalledWith(SIDECAR_DOCKED_MODE.LEFT);
  });
});
