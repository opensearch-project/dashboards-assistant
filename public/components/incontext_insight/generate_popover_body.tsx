/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiIconTip,
  EuiLoadingContent,
  EuiMarkdownFormat,
  EuiPanel,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiSpacer,
  EuiText,
  EuiTitle,
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
      let contextObj;
      try {
        contextObj = (await incontextInsight.contextProvider?.()) ?? undefined;
      } catch (e) {
        console.error('Error executing contextProvider:', e);
        toasts.addDanger(
          i18n.translate('assistantDashboards.incontextInsight.generateSummaryError', {
            defaultMessage: 'Generate summary error',
          })
        );
        closePopover();
        return;
      }
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
          const insightAgentIdExists = insightType !== undefined && response.insightAgentIdExists;
          setInsightAvailable(insightAgentIdExists);
          if (insightAgentIdExists) {
            onGenerateInsightBasedOnSummary(
              summaryType,
              insightType,
              summaryContent,
              contextContent,
              `Please provide your insight on this ${summaryType}.`
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
    summaryType: string,
    insightType: string,
    summaryContent: string,
    context: string,
    insightQuestion: string
  ) => {
    const generateInsight = async () => {
      httpSetup
        ?.post(SUMMARY_ASSISTANT_API.INSIGHT, {
          body: JSON.stringify({
            summaryType,
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
        <EuiFlexGroup gutterSize="xs" alignItems="center">
          <EuiFlexItem grow={false}>
            {showInsight ? (
              <EuiIcon
                aria-label="back-to-summary"
                size="m"
                onClick={() => {
                  setShowInsight(false);
                }}
                type="arrowLeft"
                color={'text'}
              />
            ) : (
              <EuiIcon aria-label="alert-assistant" color="hollow" size="l" type={shiny_sparkle} />
            )}
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText>
              <EuiTitle size="xxs">
                <h6>
                  {i18n.translate('assistantDashboards.incontextInsight.Summary', {
                    defaultMessage: showInsight ? 'Insight With RAG' : 'Summary',
                  })}
                </h6>
              </EuiTitle>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
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
