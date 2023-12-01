/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useChatActions } from '../hooks';
import { AssistantActions } from '../types';

interface SetContextProps {
  assistantActions: AssistantActions;
}

// TODO needs a better solution to expose hook
export const SetContext: React.FC<SetContextProps> = (props) => {
  Object.assign(props.assistantActions, useChatActions());
  return null;
};
