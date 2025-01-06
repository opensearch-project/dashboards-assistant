/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingContent,
  EuiMarkdownFormat,
  EuiPanel,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiButton,
} from '@elastic/eui';
import { useEffectOnce } from 'react-use';
import { METRIC_TYPE } from '@osd/analytics';
import { MessageActions } from '../../tabs/chat/messages/message_action';
import { ContextObj, IncontextInsight as IncontextInsightInput } from '../../types';
import { getNotifications } from '../../services';
import { HttpSetup, StartServicesAccessor } from '../../../../../src/core/public';
import { SUMMARY_ASSISTANT_API } from '../../../common/constants/llm';
import shiny_sparkle from '../../assets/shiny_sparkle.svg';
import { UsageCollectionSetup } from '../../../../../src/plugins/usage_collection/public';
import { reportMetric } from '../../utils/report_metric';
import { buildUrlQuery, createIndexPatterns, extractTimeRangeDSL } from '../../utils';
import { AssistantPluginStartDependencies } from '../../types';
import { UI_SETTINGS } from '../../../../../src/plugins/data/public';
import { formatUrlWithWorkspaceId } from '../../../../../src/core/public/utils';

export const GeneratePopoverBody: React.FC<{
  incontextInsight: IncontextInsightInput;
  httpSetup?: HttpSetup;
  usageCollection?: UsageCollectionSetup;
  closePopover: () => void;
  getStartServices?: StartServicesAccessor<AssistantPluginStartDependencies>;
}> = ({ incontextInsight, httpSetup, usageCollection, closePopover, getStartServices }) => {
  const [summary, setSummary] = useState('');
  const [insight, setInsight] = useState('');
  const [contextObject, setContextObject] = useState<ContextObj | undefined>(undefined);
  const [insightAvailable, setInsightAvailable] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const metricAppName = 'alertSummary';

  const toasts = getNotifications().toasts;

  const [displayDiscoverButton, setDisplayDiscoverButton] = useState(false);

  useEffect(() => {
    const getMonitorType = async () => {
      if (!contextObject) return;
      const monitorType = contextObject?.additionalInfo?.monitorType;
      const dsl = contextObject?.additionalInfo?.dsl;
      const isVisualEditorMonitor = contextObject?.additionalInfo?.isVisualEditorMonitor;
      // Only alerts from visual editor monitor support to navigate to discover.
      if (!isVisualEditorMonitor) {
        return;
      }
      // Only this two types from alerting contain DSL and index.
      const isSupportedMonitorType =
        monitorType === 'query_level_monitor' || monitorType === 'bucket_level_monitor';
      let hasTimeRangeFilter = false;
      if (dsl) {
        let dslObject;
        try {
          dslObject = JSON.parse(dsl);
        } catch (e) {
          console.error('Invalid DSL', e);
          return;
        }
        const filters = dslObject?.query?.bool?.filter;
        // Filters contains time range filter,if no filters, return.
        if (!filters?.length) return;
        hasTimeRangeFilter = !!extractTimeRangeDSL(filters).timeRangeDSL;
      }
      setDisplayDiscoverButton(isSupportedMonitorType && hasTimeRangeFilter);
    };
    getMonitorType();
  }, [contextObject, setDisplayDiscoverButton]);

  useEffectOnce(() => {
    onGenerateSummary(
      incontextInsight.suggestions && incontextInsight.suggestions.length > 0
        ? incontextInsight.suggestions[0]
        : 'Please summarize the input'
    );
  });

  const onGenerateSummary = (summarizationQuestion: string) => {
    const summarize = async () => {
      let contextObj: ContextObj | undefined;
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
      // onGenerateSummary will get contextObj when mounted, use this returned value to set state to avoid re-fetch.
      setContextObject(contextObj);
      const contextContent = contextObj?.context || '';
      const dataSourceId = contextObj?.dataSourceId;
      const dataSourceQuery = dataSourceId ? { dataSourceId } : {};
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
      const index = contextObj?.additionalInfo?.index;
      const dsl = contextObj?.additionalInfo?.dsl;
      const topNLogPatternData = contextObj?.additionalInfo?.topNLogPatternData;

      await httpSetup
        ?.post(SUMMARY_ASSISTANT_API.SUMMARIZE, {
          body: JSON.stringify({
            summaryType,
            insightType,
            question: summarizationQuestion,
            context: contextContent,
            index,
            dsl,
            topNLogPatternData,
          }),
          query: dataSourceQuery,
        })
        .then((response) => {
          const summaryContent = response.summary;
          setSummary(summaryContent);
          const insightAgentIdExists = !!insightType && response.insightAgentIdExists;
          setInsightAvailable(insightAgentIdExists);
          if (insightAgentIdExists) {
            onGenerateInsightBasedOnSummary(
              dataSourceQuery,
              summaryType,
              insightType,
              summaryContent,
              contextContent,
              `Please provide your insight on this ${summaryType}.`
            );
          }
          reportMetric(usageCollection, metricAppName, 'generated', METRIC_TYPE.COUNT);
        })
        .catch((error) => {
          console.error('Error generate summary:', error);
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
    dataSourceQuery: {},
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
          query: dataSourceQuery,
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

  const handleNavigateToDiscover = async () => {
    try {
      setDiscoverLoading(true);
      if (!contextObject) return;
      const dsl = contextObject?.additionalInfo?.dsl;
      const indexName = contextObject?.additionalInfo?.index;
      if (!dsl || !indexName) return;
      const dslObject = JSON.parse(dsl);
      const filters = dslObject?.query?.bool?.filter;
      if (!filters?.length) return;
      const { timeRangeDSL, newFilters, timeFieldName } = extractTimeRangeDSL(filters);
      // Filter out time range DSL and use this result to build filter query.
      if (!timeFieldName || !timeRangeDSL) return;
      dslObject.query.bool.filter = newFilters;

      if (getStartServices) {
        const [coreStart, startDeps] = await getStartServices();
        const newDiscoverEnabled = coreStart.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED);
        if (!newDiscoverEnabled) {
          // Only new discover supports DQL with filters.
          coreStart.uiSettings.set(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED, true);
        }

        const indexPattern = await createIndexPatterns(
          startDeps.data,
          indexName,
          timeFieldName,
          contextObject?.dataSourceId
        );
        if (!indexPattern) return;
        const query = await buildUrlQuery(
          startDeps.data,
          coreStart.savedObjects,
          indexPattern,
          dslObject,
          timeRangeDSL,
          contextObject?.dataSourceId
        );
        // Navigate to new discover with query built to populate, use new window to avoid discover search failed.
        const discoverUrl = `data-explorer/discover#?${query}`;
        const currentWorkspace = coreStart.workspaces.currentWorkspace$.getValue();
        const url = formatUrlWithWorkspaceId(
          discoverUrl,
          currentWorkspace?.id ?? '',
          coreStart.http.basePath
        );
        window.open(url, '_blank');
      }
    } finally {
      setDiscoverLoading(false);
    }
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
                  {showInsight
                    ? i18n.translate('assistantDashboards.inContextInsight.withRAGSummary', {
                        defaultMessage: 'Insight With RAG',
                      })
                    : i18n.translate('assistantDashboards.inContextInsight.summary', {
                        defaultMessage: 'Summary',
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
    const traceTip = 'Insight With RAG';
    return (
      <EuiPopoverFooter className="incontextInsightGeneratePopoverFooter" paddingSize="none">
        {
          <div style={{ display: showInsight ? 'none' : 'block' }}>
            <MessageActions
              contentToCopy={summary}
              showFeedback
              showTraceIcon={insightAvailable}
              onViewTrace={() => {
                setShowInsight(true);
              }}
              traceTip={traceTip}
              usageCollection={usageCollection}
              isOnTrace={showInsight}
              metricAppName={metricAppName}
            />
          </div>
        }
        {
          <div style={{ display: showInsight && insightAvailable ? 'block' : 'none' }}>
            <MessageActions
              contentToCopy={insight}
              showFeedback
              showTraceIcon={insightAvailable}
              onViewTrace={() => {}}
              traceTip={traceTip}
              usageCollection={usageCollection}
              isOnTrace={showInsight}
              metricAppName={metricAppName}
            />
          </div>
        }
      </EuiPopoverFooter>
    );
  };

  return (
    <>
      {renderInnerTitle()}
      {renderContent()}
      {displayDiscoverButton && (
        <EuiButton onClick={handleNavigateToDiscover} isLoading={discoverLoading}>
          {i18n.translate('assistantDashboards.incontextInsight.discover', {
            defaultMessage: 'Discover details',
          })}
        </EuiButton>
      )}
    </>
  );
};
