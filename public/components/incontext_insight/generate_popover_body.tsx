/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { IMessage, Interaction, IOutput } from 'common/types/chat_saved_object_attributes';
import { MessageActions } from '../../tabs/chat/messages/message_action';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getConfigSchema, getIncontextInsightRegistry, getNotifications } from '../../services';
import { HttpSetup } from '../../../../../src/core/public';
import { ASSISTANT_API } from '../../../common/constants/llm';
import { getAssistantRole } from '../../utils/constants';

export const GeneratePopoverBody: React.FC<{
  incontextInsight: IncontextInsightInput;
  httpSetup?: HttpSetup;
  closePopover: () => void;
}> = ({ incontextInsight, httpSetup, closePopover }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [message, setMessage] = useState<IMessage | null>(null);

  const toasts = getNotifications().toasts;
  const registry = getIncontextInsightRegistry();

  const onChatContinuation = () => {
    registry?.continueInChat(incontextInsight, conversationId);
    closePopover();
  };

  const onGenerateSummary = (summarizationQuestion: string) => {
    setIsLoading(true);
    setSummary('');
    setConversationId('');
    const summarize = async () => {
      const contextContent = incontextInsight.contextProvider
        ? await incontextInsight.contextProvider()
        : '';
      let incontextInsightType: string;
      const endIndex = incontextInsight.key.indexOf('_', 0);
      if (endIndex !== -1) {
        incontextInsightType = incontextInsight.key.substring(0, endIndex);
      } else {
        incontextInsightType = incontextInsight.key;
      }

      await httpSetup
        ?.post(ASSISTANT_API.SEND_MESSAGE, {
          body: JSON.stringify({
            messages: [],
            input: {
              type: 'input',
              content: summarizationQuestion,
              contentType: 'text',
              context: { content: contextContent, dataSourceId: incontextInsight.datasourceId },
              promptPrefix: getAssistantRole(incontextInsightType),
            },
          }),
        })
        .then((response) => {
          const interactionLength = response.interactions.length;
          if (interactionLength > 0) {
            setConversationId(response.interactions[interactionLength - 1].conversation_id);
            setInteraction(response.interactions[interactionLength - 1]);
          }

          const messageLength = response.messages.length;
          if (messageLength > 0 && response.messages[messageLength - 1].type === 'output') {
            setSummary(response.messages[messageLength - 1].content);
            setMessage(response.messages[messageLength - 1]);
          }
        })
        .catch((error) => {
          toasts.addDanger(
            i18n.translate('assistantDashboards.incontextInsight.generateSummaryError', {
              defaultMessage: 'Generate summary error',
            })
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    return summarize();
  };

  return summary ? (
    <>
      <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="plain">
        <EuiText size="s">{summary}</EuiText>
      </EuiPanel>
      <EuiSpacer size={'xs'} />
      {
        <EuiPanel
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          paddingSize="s"
          hasBorder={false}
          hasShadow={false}
          color="plain"
        >
          <MessageActions
            contentToCopy={summary}
            showRegenerate
            onRegenerate={async () => {
              await onGenerateSummary(
                incontextInsight.suggestions && incontextInsight.suggestions.length > 0
                  ? incontextInsight.suggestions[0]
                  : 'Please summarize the input'
              );
            }}
            interaction={interaction}
            showFeedback
            message={message as IOutput}
            showTraceIcon={false}
          />
          {getConfigSchema().chat.enabled && (
            <EuiPanel
              hasShadow={false}
              hasBorder={false}
              element="div"
              onClick={() => onChatContinuation()}
              grow={false}
              paddingSize="none"
              style={{ width: '120px', float: 'right' }}
            >
              <EuiFlexGroup gutterSize="none" style={{ marginTop: 5 }}>
                <EuiFlexItem grow={false}>
                  <EuiIcon type={'chatRight'} style={{ marginRight: 5 }} />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="xs">
                    {i18n.translate('assistantDashboards.incontextInsight.continueInChat', {
                      defaultMessage: 'Continue in chat',
                    })}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          )}
        </EuiPanel>
      }
    </>
  ) : (
    <EuiButton
      onClick={async () => {
        await onGenerateSummary(
          incontextInsight.suggestions && incontextInsight.suggestions.length > 0
            ? incontextInsight.suggestions[0]
            : 'Please summarize the input'
        );
      }}
      isLoading={isLoading}
      disabled={isLoading}
    >
      {isLoading
        ? i18n.translate('assistantDashboards.incontextInsight.generatingSummary', {
            defaultMessage: 'Generating summary...',
          })
        : i18n.translate('assistantDashboards.incontextInsight.generateSummary', {
            defaultMessage: 'Generate summary',
          })}
    </EuiButton>
  );
};
