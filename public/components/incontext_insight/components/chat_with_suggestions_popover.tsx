/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IncontextInsight as IncontextInsightInput } from '../../../types';
import { SuggestionsPopoverFooter } from './suggestions_popover_footer';
import { ChatPopoverBody } from './chat_popover_body';
import { IToasts } from '../../../../../../src/core/public';

export interface ChatWithSuggestionsProps {
  toasts: IToasts;
  incontextInsight: IncontextInsightInput;
  suggestions: string[];
  onSubmitClick: (incontextInsight: IncontextInsightInput, suggestion: string) => void;
}

export const ChatWithSuggestionsPopover: React.FC<ChatWithSuggestionsProps> = ({
  toasts,
  incontextInsight,
  suggestions,
  onSubmitClick,
}) => (
  <>
    {<ChatPopoverBody toasts={toasts} />}
    {
      <SuggestionsPopoverFooter
        incontextInsight={incontextInsight}
        suggestions={suggestions}
        onSubmitClick={onSubmitClick}
      />
    }
  </>
);
