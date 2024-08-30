/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiLoadingContent,
  EuiMarkdownFormat,
  EuiPanel,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { useEffectOnce } from 'react-use';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getNotifications } from '../../services';
import { HttpSetup } from '../../../../../src/core/public';
import { SUMMARY_ASSISTANT_API } from '../../../common/constants/llm';
import shiny_sparkle from '../../assets/shiny_sparkle.svg';

export const GeneratePopoverBody: React.FC<{
  incontextInsight: IncontextInsightInput;
  httpSetup?: HttpSetup;
  closePopover: () => void;
}> = ({ incontextInsight, httpSetup, closePopover }) => {
  const [summary, setSummary] = useState('');
  const [insight, setInsight] = useState('');
  const [insightAvailable, setInsightAvailable] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const toasts = getNotifications().toasts;

  useEffectOnce(() => {
    onGenerateSummary(
      incontextInsight.suggestions && incontextInsight.suggestions.length > 0
        ? incontextInsight.suggestions[0]
        : 'Please summarize the input'
    );
  });

  const onGenerateSummary = (summarizationQuestion: string) => {
    const summarize = async () => {
      const contextObj = incontextInsight.contextProvider
        ? await incontextInsight.contextProvider()
        : undefined;
      const contextContent = contextObj?.context || '';
      let summaryType: string;
      const endIndex = incontextInsight.key.indexOf('_', 0);
      if (endIndex !== -1) {
        summaryType = incontextInsight.key.substring(0, endIndex);
      } else {
        summaryType = incontextInsight.key;
      }
      const insightType =
        summaryType === 'alerts'
          ? contextObj?.additionalInfo.monitorType === 'cluster_metrics_monitor'
            ? 'os_insight'
            : 'user_insight'
          : undefined;

      await httpSetup
        ?.post(SUMMARY_ASSISTANT_API.SUMMARIZE, {
          body: JSON.stringify({
            type: summaryType,
            insightType,
            question: summarizationQuestion,
            context: contextContent,
          }),
        })
        .then((response) => {
          const summaryContent = response.summary;
          setSummary(summaryContent);
          const insightAgentIdExists = !!response.insightAgentId;
          setInsightAvailable(insightAgentIdExists);
          if (insightAgentIdExists) {
            onGenerateInsightBasedOnSummary(
              response.insightAgentId,
              summaryType,
              summaryContent,
              contextContent,
              'Please provide your insight on this alert to help users understand this alert, find potential causes and give feasible solutions to address this alert'
            );
          }
        })
        .catch((error) => {
          toasts.addDanger(
            i18n.translate('assistantDashboards.incontextInsight.generateSummaryError', {
              defaultMessage: 'Generate summary error',
            })
          );
          closePopover();
        });
    };

    return summarize();
  };

  const onGenerateInsightBasedOnSummary = (
    insightAgentId: string,
    insightType: string,
    summaryContent: string,
    context: string,
    insightQuestion: string
  ) => {
    const generateInsight = async () => {
      httpSetup
        ?.post(SUMMARY_ASSISTANT_API.INSIGHT, {
          body: JSON.stringify({
            insightAgentId,
            insightType,
            summary: summaryContent,
            context,
            question: insightQuestion,
          }),
        })
        .then((response) => {
          setInsight(response);
        })
        .catch((error) => {
          toasts.addDanger(
            i18n.translate('assistantDashboards.incontextInsight.generateSummaryError', {
              defaultMessage: 'Generate insight error',
            })
          );
          setInsightAvailable(false);
          setShowInsight(false);
        });
    };

    return generateInsight();
  };

  const renderContent = () => {
    const content = showInsight && insightAvailable ? insight : summary;
    return content ? (
      <>
        <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="subdued">
          <EuiText className="incontextInsightGeneratePopoverContent" size="s">
            <EuiMarkdownFormat>{content}</EuiMarkdownFormat>
          </EuiText>
          <EuiSpacer size={'xs'} />
          {renderInnerFooter()}
        </EuiPanel>
      </>
    ) : (
      <EuiLoadingContent aria-label="loading_content" />
    );
  };

  const renderInnerTitle = () => {
    return (
      <EuiPopoverTitle className="incontextInsightGeneratePopoverTitle" paddingSize="l">
        {showInsight ? (
          <EuiFlexGroup gutterSize="none">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                aria-label="back-to-summary"
                flush="left"
                size="xs"
                onClick={() => {
                  setShowInsight(false);
                }}
                iconType="arrowLeft"
                iconSide={'left'}
                color={'text'}
              >
                {i18n.translate('assistantDashboards.incontextInsight.InsightWithRAG', {
                  defaultMessage: 'Insight With RAG',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          <EuiFlexGroup gutterSize="none">
            <EuiFlexItem>
              <div>
                <EuiBadge
                  aria-label="alert-assistant"
                  color="hollow"
                  iconType={shiny_sparkle}
                  iconSide="left"
                >
                  {i18n.translate('assistantDashboards.incontextInsight.Summary', {
                    defaultMessage: 'Summary',
                  })}
                </EuiBadge>
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </EuiPopoverTitle>
    );
  };

  const renderInnerFooter = () => {
    return (
      <EuiPopoverFooter className="incontextInsightGeneratePopoverFooter" paddingSize="none">
        <EuiFlexGroup gutterSize="none" direction={'rowReverse'}>
          {insightAvailable && (
            <EuiFlexItem
              grow={false}
              onClick={() => {
                setShowInsight(true);
              }}
            >
              <EuiIconTip
                aria-label="Insight"
                type="iInCircle"
                content="Insight with RAG"
                color={showInsight ? 'blue' : 'black'}
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPopoverFooter>
    );
  };

  return (
    <>
      {renderInnerTitle()}
      {renderContent()}
    </>
  );
};
