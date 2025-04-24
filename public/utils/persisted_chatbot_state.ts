/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISidecarConfig } from '../../../../src/core/public/overlays/sidecar';
import { getLocalStorage } from '../services';

export interface ChatbotState {
  isOpen?: boolean;
  sidecarConfig?: Omit<ISidecarConfig, 'isHidden'>;
}

const CHATBOT_STATE_KEY = 'chatbotState';

export const getChatbotOpenStatus = () => getChatbotState()?.isOpen === true;

export const setChatbotOpenStatus = (isOpen: boolean) =>
  setChatbotState({ ...getChatbotState(), isOpen });

export const setChatbotSidecarConfig = ({ isHidden, ...restConfig }: ISidecarConfig) => {
  setChatbotState({ ...getChatbotState(), sidecarConfig: restConfig });
};

export const getChatbotState = (): ChatbotState | null => getLocalStorage().get(CHATBOT_STATE_KEY);

export const setChatbotState = (state: ChatbotState) =>
  getLocalStorage().set(CHATBOT_STATE_KEY, state);
