/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef } from 'react';

import { useCore } from '../contexts/core_context';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from '../../../../src/core/public';

// There are some UI components from library whose position is fixed and are not compatible with each other and also not compatible with sidecar container.
// There is currently no way to provide config for these components at runtime.
// This hook patches a style for all these already known components to make them compatible with sidecar.
// TODO: Use config provider from UI library to make this more reasonable.
export const usePatchFixedStyle = () => {
  const core = useCore();
  const sidecarConfig$ = core.overlays.sidecar().getSidecarConfig$();

  useEffect(() => {
    const css = '';
    const style = document.createElement('style');
    const text = document.createTextNode(css);
    document.head.appendChild(style);
    style.appendChild(text);

    const subscription = sidecarConfig$.subscribe((config) => {
      if (!config) return;
      updateHeadStyle(config, text);
    });
    return () => {
      subscription.unsubscribe();
      document.head.removeChild(style);
      style.removeChild(text);
    };
  }, [sidecarConfig$]);
};

function updateHeadStyle(config: ISidecarConfig, text?: Text) {
  let css = '';
  if (!text) return;

  if (
    // When sidecar is opened and docked position is left or right, we should patch style.
    config?.isHidden !== true &&
    config.paddingSize &&
    (config.dockedMode === SIDECAR_DOCKED_MODE.LEFT ||
      config.dockedMode === SIDECAR_DOCKED_MODE.RIGHT)
  ) {
    const { dockedMode, paddingSize } = config;
    if (dockedMode === SIDECAR_DOCKED_MODE.RIGHT) {
      // Current applied components include flyout and bottomBar.
      // Although the class names of actual rendered component start with eui. We will also apply oui for fallback.
      css = `
        .euiFlyout:not(.euiFlyout--left) {
           right: ${paddingSize}px
        }
        .ouiFlyout:not(.ouiFlyout--left) {
          right: ${paddingSize}px
       }
        .euiBottomBar{
            padding-right: ${paddingSize}px
        }
        .ouiBottomBar{
          padding-right: ${paddingSize}px
      }
        `;
    } else if (dockedMode === SIDECAR_DOCKED_MODE.LEFT) {
      css = `
        .euiFlyout--left {
           left: ${paddingSize}px
        }
        .ouiFlyout--left {
          left: ${paddingSize}px
       }
        .euiBottomBar{
            padding-left: ${paddingSize}px
        }
        .ouiBottomBar{
          padding-left: ${paddingSize}px
      }
        `;
    }
  }

  // If sidecar closes or docked direction change to takeover mode, we will keep css empty to remove patch style and update.
  requestAnimationFrame(() => {
    text.textContent = css;
  });
}
