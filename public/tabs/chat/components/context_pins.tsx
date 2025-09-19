/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText, EuiIcon, EuiButtonIcon } from '@elastic/eui';
import React from 'react';
import { useChatContext } from '../../../contexts';

interface ContextItem {
  level: number;
  displayName: string;
  notebookId?: string;
  hypothesisId?: string;
  contextContent: string;
}

export const ContextPins: React.FC = () => {
  const chatContext = useChatContext();

  // Extract context items from session context
  const sessionContext = chatContext.sessionContext;
  let contextItems: ContextItem[] = [];

  if (sessionContext) {
    // Handle hierarchical investigation context structure
    if (sessionContext.investigation && Array.isArray(sessionContext.investigation)) {
      // Sort by level in ascending order (0, 1, 2, ...)
      contextItems = sessionContext.investigation.sort((a, b) => a.level - b.level);
    } else if (sessionContext.name || sessionContext.title || sessionContext.displayName) {
      // Fallback to simple context - create a single item
      contextItems = [
        {
          level: 0,
          displayName: sessionContext.name || sessionContext.title || sessionContext.displayName,
          contextContent: '',
        },
      ];
    }
  }

  if (contextItems.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {contextItems.map((item, index) => {
          // Extract just the main part after the prefix for display
          const displayText = item.displayName;

          return (
            <div
              key={`${item.level}-${index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgb(130, 154, 182)',
                border: '1px solid rgb(130, 154, 182)',
                borderRadius: '12px',
                padding: '2px 6px',
                gap: '4px',
                fontSize: '11px',
                color: '#ffffff',
                maxWidth: 'fit-content',
                height: '20px',
              }}
            >
              <EuiIcon
                type="pin"
                size="s"
                color="ghost"
                style={{ width: '12px', height: '12px' }}
              />
              <EuiText
                size="xs"
                style={{ margin: 0, fontSize: '11px', lineHeight: '1', color: '#ffffff' }}
              >
                {displayText}
              </EuiText>
            </div>
          );
        })}
      </div>
    </div>
  );
};
