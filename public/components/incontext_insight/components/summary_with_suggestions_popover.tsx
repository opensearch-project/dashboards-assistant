/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IncontextInsight as IncontextInsightInput } from '../../../types';
import { SummaryPopoverBody } from './summary_popover_body';
import { SuggestionsPopoverFooter } from './suggestions_popover_footer';

export interface SummaryWithSuggestionsProps {
  incontextInsight: IncontextInsightInput;
  suggestions: string[];
  onSubmitClick: (incontextInsight: IncontextInsightInput, suggestion: string) => void;
}

export const SummaryWithSuggestionsPopover: React.FC<SummaryWithSuggestionsProps> = ({
  incontextInsight,
  suggestions,
  onSubmitClick,
}) => (
  <>
    {<SummaryPopoverBody incontextInsight={incontextInsight} />}
    {
      <SuggestionsPopoverFooter
        incontextInsight={incontextInsight}
        suggestions={suggestions}
        onSubmitClick={onSubmitClick}
      />
    }
  </>
);
