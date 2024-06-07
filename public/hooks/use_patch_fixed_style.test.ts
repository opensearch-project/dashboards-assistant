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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should patch corresponding left style when sidecarConfig$ pipe', async () => {
    renderHook(() => usePatchFixedStyle());
    act(() =>
      sidecarConfig$.next({
        dockedMode: SIDECAR_DOCKED_MODE.LEFT,
        paddingSize: 300,
      })
    );
    await new Promise((r) => setTimeout(r, 2000));

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
    await new Promise((r) => setTimeout(r, 2000));

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
    await new Promise((r) => setTimeout(r, 2000));

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
    await new Promise((r) => setTimeout(r, 2000));

    expect(document.head).toMatchSnapshot();
  });
});
