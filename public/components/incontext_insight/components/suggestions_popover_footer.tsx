/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiText, EuiPopoverFooter, EuiSpacer, EuiListGroup, EuiListGroupItem } from '@elastic/eui';
import React from 'react';
import { IncontextInsight as IncontextInsightInput } from '../../../types';

export interface SuggestionsPopoverFooterProps {
  incontextInsight: IncontextInsightInput;
  suggestions: string[];
  onSubmitClick: (incontextInsight: IncontextInsightInput, suggestion: string) => void;
}

export const SuggestionsPopoverFooter: React.FC<SuggestionsPopoverFooterProps> = ({
  incontextInsight,
  suggestions,
  onSubmitClick,
}) => (
  <EuiPopoverFooter className="incontextInsightPopoverFooter" paddingSize="none">
    <EuiText size="xs" color="subdued">
      {i18n.translate('assistantDashboards.incontextInsight.availableSuggestions', {
        defaultMessage: 'Available suggestions',
      })}
    </EuiText>
    <EuiListGroup flush>
      {suggestions.map((suggestion, index) => (
        <div key={`${incontextInsight.key}-${index}-${incontextInsight.interactionId}`}>
          <EuiSpacer size="xs" />
          <EuiListGroupItem
            label={suggestion}
            className="incontextInsightSuggestionListItem"
            color="subdued"
            iconType="chatRight"
            iconProps={{ size: 's' }}
            onClick={() => onSubmitClick(incontextInsight, suggestion)}
            aria-label={suggestion}
            wrapText
            size="xs"
            extraAction={{
              onClick: () => onSubmitClick(incontextInsight, suggestion),
              iconType: 'sortRight',
              iconSize: 's',
              alwaysShow: true,
              color: 'subdued',
            }}
          />
        </div>
      ))}
    </EuiListGroup>
  </EuiPopoverFooter>
);
