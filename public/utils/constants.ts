/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { SIDECAR_DOCKED_MODE } from '../../../../src/core/public';

export enum TAB_ID {
  CHAT = 'chat',
  COMPOSE = 'compose',
  INSIGHTS = 'insights',
  HISTORY = 'history',
  TRACE = 'trace',
}

export const DEFAULT_SIDECAR_DOCKED_MODE = SIDECAR_DOCKED_MODE.RIGHT;
export const DEFAULT_SIDECAR_LEFT_OR_RIGHT_SIZE = 460;
// this is a default padding top size for sidecar when switching to takeover
export const DEFAULT_SIDECAR_TAKEOVER_PADDING_TOP_SIZE = 136;
