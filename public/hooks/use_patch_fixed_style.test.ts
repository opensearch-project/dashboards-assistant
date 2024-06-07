/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';

import { usePatchFixedStyle } from './use_patch_fixed_style';
import * as coreHookExports from '../contexts/core_context';
import { BehaviorSubject } from 'rxjs';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from '../../../../src/core/public';

describe('usePatchFixedStyle hook', () => {
  const sidecarConfig$ = new BehaviorSubject<ISidecarConfig | undefined>({
    dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
    paddingSize: 300,
  });

  beforeEach(() => {
    jest.spyOn(coreHookExports, 'useCore').mockReturnValue({
      overlays: {
        // @ts-ignore
        sidecar: () => {
          return {
            getSidecarConfig$: () => {
              return sidecarConfig$;
            },
          };
        },
      },
    });
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.requestAnimationFrame.mockRestore();
  });

  it('should patch corresponding left style when sidecarConfig$ pipe', async () => {
    renderHook(() => usePatchFixedStyle());
    act(() =>
      sidecarConfig$.next({
        dockedMode: SIDECAR_DOCKED_MODE.LEFT,
        paddingSize: 300,
      })
    );

    expect(document.head).toMatchSnapshot();
  });

  it('should patch corresponding right style when sidecarConfig$ pipe', async () => {
    renderHook(() => usePatchFixedStyle());
    act(() =>
      sidecarConfig$.next({
        dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
        paddingSize: 300,
      })
    );

    expect(document.head).toMatchSnapshot();
  });

  it('should patch empty style when isHidden of sidecarConfig$ is true', async () => {
    renderHook(() => usePatchFixedStyle());
    act(() =>
      sidecarConfig$.next({
        dockedMode: SIDECAR_DOCKED_MODE.LEFT,
        paddingSize: 300,
        isHidden: true,
      })
    );

    expect(document.head).toMatchSnapshot();
  });

  it('should patch empty style when dockedMode of sidecarConfig$ is takeover', async () => {
    renderHook(() => usePatchFixedStyle());
    act(() =>
      sidecarConfig$.next({
        dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
        paddingSize: 300,
      })
    );

    expect(document.head).toMatchSnapshot();
  });

  it('should not subscribe update after unmount', async () => {
    const { unmount } = renderHook(() => usePatchFixedStyle());
    act(() =>
      sidecarConfig$.next({
        dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
        paddingSize: 300,
      })
    );
    expect(document.head).toMatchSnapshot();

    unmount();

    act(() =>
      sidecarConfig$.next({
        dockedMode: SIDECAR_DOCKED_MODE.LEFT,
        paddingSize: 500,
      })
    );
    expect(document.head).toMatchSnapshot();
  });
});
