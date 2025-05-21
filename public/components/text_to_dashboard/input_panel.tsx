/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Subscription } from 'rxjs';
import {
  EuiBadge,
  EuiButton,
  EuiCommentList,
  EuiCommentProps,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingContent,
  EuiLoadingLogo,
  EuiPage,
  EuiPageBody,
  EuiProgress,
  EuiText,
  EuiBreadcrumb,
  EuiHeaderLinks,
  EuiButtonIcon,
  EuiSpacer,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useLocation } from 'react-router-dom';
import { CoreStart, HeaderVariant } from '../../../../../src/core/public';
import { DataPublicPluginStart, IndexPattern } from '../../../../../src/plugins/data/public';
import { Pipeline } from '../../utils/pipeline/pipeline';
import { PPLSampleTask } from '../../utils/pipeline/ppl_sample_task';
import { DataInsightsTask } from '../../utils/pipeline/data_insights_task';
import { CheckableDataList } from './checkable_data_list';
import { Text2PPLTask } from '../../utils/pipeline/text_to_ppl_task';
import { Text2VegaTask } from '../../utils/pipeline/text_to_vega_task';
import { getVisNLQSavedObjectLoader } from '../../vis_nlq/saved_object_loader';
import { VisNLQSavedObject } from '../../vis_nlq/types';
import { createDashboard } from './create_dashboard';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { MountPointPortal } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { StartServices } from '../../types';
import { SourceSelector } from '../visualization/source_selector';

type Status = 'INSIGHTS_LOADING' | 'INSIGHTS_LOADED' | 'DASHBOARDS_CREATING' | 'DASHBOARDS_CREATED';

export const InputPanel = () => {
  const {
    services: {
      application,
      chrome,
      notifications,
      data,
      http,
      uiSettings,
      savedObjects,
      setHeaderActionMenu,
    },
  } = useOpenSearchDashboards<StartServices>();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const indexPatternId = searchParams.get('indexPatternId') || '';
  const dataSourceId = searchParams.get('dataSourceId');
  const [indexPattern, setIndexPattern] = useState<IndexPattern | null>(null);
  const [dataInsights, setDataInsights] = useState<Record<string, string[]>>({});
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [updateMessages, setUpdateMessages] = useState<EuiCommentProps[]>([]);
  const [panelStatus, setPanelStatus] = useState<Status>('INSIGHTS_LOADING');
  const dataInsightsPipeline = useRef<Pipeline | null>(null);
  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  // Load index pattern from URL parameter
  useEffect(() => {
    if (indexPatternId) {
      data.indexPatterns
        .get(indexPatternId)
        .then((pattern) => {
          setIndexPattern(pattern);
        })
        .catch((e) => {
          console.error('Failed to load index pattern:', e);
          notifications.toasts.addDanger({
            title: i18n.translate('dashboardAssistant.feature.text2dash.loadFailed', {
              defaultMessage: 'Failed to load index pattern: {id}',
              values: { id: indexPatternId },
            }),
          });
        });
    }
  }, [indexPatternId, data.indexPatterns, notifications]);

  if (dataInsightsPipeline.current === null && indexPattern) {
    dataInsightsPipeline.current = new Pipeline([
      new PPLSampleTask(data.search),
      new DataInsightsTask(http),
    ]);
  }

  useEffect(() => {
    let subscription: Subscription;
    if (dataInsightsPipeline.current) {
      subscription = dataInsightsPipeline.current.status$.subscribe({
        next: (status) => {
          setPanelStatus(status === 'RUNNING' ? 'INSIGHTS_LOADING' : 'INSIGHTS_LOADED');
        },
        error: (err) => {
          setPanelStatus('INSIGHTS_LOADED');
          notifications.toasts.addDanger({
            title: 'Failed to generate insights',
            text: err.message || 'An error occurred while generating insights',
          });
        },
        complete: () => {
          console.log('Pipeline status$ completed');
        },
      });
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [indexPattern]);

  useEffect(() => {
    let subscription: Subscription;
    if (dataInsightsPipeline.current) {
      subscription = dataInsightsPipeline.current.output$.subscribe({
        next: (output) => {
          setDataInsights(output.dataInsights);
        },
        error: (err) => {
          notifications.toasts.addDanger({
            title: 'Failed to generate insights',
            text: err.message || 'An error occurred while generating insights',
          });
        },
        complete: () => {
          console.log('Pipeline output$ completed');
        },
      });
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [indexPattern]);

  useEffect(() => {
    if (dataInsightsPipeline.current && indexPattern) {
      dataInsightsPipeline.current.run({
        ppl: `source=${indexPattern.getIndex()}`,
        dataSourceId,
      });
    }
  }, [indexPattern, dataSourceId]);

  const onToggle = useCallback(
    (item: string) => {
      const selection = new Set(selectedInsights);
      if (selection.has(item)) {
        selection.delete(item);
      } else {
        selection.add(item);
      }
      setSelectedInsights([...selection]);
    },
    [selectedInsights]
  );

  const onGenerate = useCallback(async () => {
    if (!indexPattern) return;
    setPanelStatus('DASHBOARDS_CREATING');
    setUpdateMessages([
      {
        username: 'Dashboards assistant',
        event: 'started to create visualization',
        type: 'update',
        timelineIcon: 'sparkleFilled',
      },
    ]);
    const visualizations: Array<{ id: string; type: string }> = [];

    for (const insight of selectedInsights) {
      const pipeline = new Pipeline([
        new Text2PPLTask(http),
        new PPLSampleTask(data.search),
        new Text2VegaTask(http, savedObjects),
      ]);
      try {
        const [inputQuestion, inputInstruction] = insight.split('//');
        // generate vega spec
        // TODO: validate output.vega presence
        const output = await pipeline.runOnce({
          index: indexPattern.getIndex(),
          inputQuestion,
          inputInstruction,
          dataSourceId,
        });
        const visTitle = output?.vega?.title;
        const visDescription = output?.vega?.description;
        // saved visualization
        const loader = getVisNLQSavedObjectLoader();
        const savedVis: VisNLQSavedObject = await loader.get();
        savedVis.visualizationState = JSON.stringify({
          title: visTitle,
          type: 'vega-lite',
          params: {
            spec: output?.vega,
          },
        });
        savedVis.uiState = JSON.stringify({
          input: inputQuestion,
          instruction: inputInstruction,
        });
        savedVis.searchSourceFields = { index: indexPattern };
        savedVis.title = visTitle;
        savedVis.description = visDescription;
        const id = await savedVis.save({});
        visualizations.push({ id, type: 'visualization-nlq' });

        const url = application.getUrlForApp('text2viz', {
          path: `edit/${id}`,
        });

        setUpdateMessages((messages) => [
          ...messages,
          {
            username: 'Dashboards assistant',
            event: (
              <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiText>created visualization</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color="success">success</EuiBadge>
                </EuiFlexItem>
              </EuiFlexGroup>
            ),
            type: 'update',
            children: (
              <EuiText size="s">
                <p>
                  {insight}{' '}
                  <EuiLink href={url} target="_blank">
                    view
                  </EuiLink>
                </p>
              </EuiText>
            ),
            timelineIcon: 'check',
          },
        ]);
      } catch (e) {
        setUpdateMessages((messages) => [
          ...messages,
          {
            username: 'Dashboards assistant',
            event: (
              <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiText>created visualization</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color="danger">fail</EuiBadge>
                </EuiFlexItem>
              </EuiFlexGroup>
            ),
            children: (
              <EuiText size="s">
                <p>{insight}</p>
              </EuiText>
            ),
            timelineIcon: 'cross',
          },
        ]);
      }
    }

    try {
      // create dashboard
      const dashboard = await createDashboard(visualizations);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      application.navigateToUrl(dashboard.url);
    } catch (e) {
      setUpdateMessages((messages) => [
        ...messages,
        {
          username: 'Dashboards assistant',
          event: (
            <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiText>created dashboard</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="danger">fail</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          type: 'update',
          timelineIcon: 'cross',
        },
      ]);
    }

    setPanelStatus('DASHBOARDS_CREATED');
  }, [http, savedObjects, data, selectedInsights, dataSourceId, indexPattern, application]);

  // Set breadcrumbs
  useEffect(() => {
    const pageTitle = i18n.translate('dashboardAssistant.feature.text2dash.title', {
      defaultMessage: 'New Dashboard',
    });
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: i18n.translate('dashboardAssistant.feature.text2dash.breadcrumbs.dashboards', {
          defaultMessage: 'Dashboards',
        }),
        onClick: () => {
          application.navigateToApp('dashboards');
        },
      },
    ];
    if (!useUpdatedUX) {
      breadcrumbs.push({
        text: pageTitle,
      });
    }
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, application, uiSettings]);

  useEffect(() => {
    chrome.setHeaderVariant(HeaderVariant.APPLICATION);
    return () => {
      chrome.setHeaderVariant();
    };
  }, [chrome]);

  const getInputSection = () => {
    return (
      <>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={2} style={{ width: 0 }}>
            <SourceSelector
              selectedSourceId={indexPatternId}
              onChange={(ds) => {
                const newParams = new URLSearchParams(search);
                newParams.set('indexPatternId', ds.value);
                application.navigateToUrl(
                  application.getUrlForApp('dashboards', {
                    path: `/text2dash?${newParams.toString()}`,
                  })
                );
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  };

  if (!indexPattern) {
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiEmptyPrompt
            iconType="alert"
            iconColor="danger"
            title={<h2>Index Pattern Not Found</h2>}
            body={
              <EuiText size="s">
                <p>Unable to load the specified index pattern.</p>
              </EuiText>
            }
          />
        </EuiPageBody>
      </EuiPage>
    );
  }

  return (
    <EuiPage
      className="text2dash__page"
      direction="column"
      style={{ width: '65%', margin: '0 auto' }}
    >
      <MountPointPortal setMountPoint={setHeaderActionMenu}>
        <EuiFlexGroup alignItems="center" gutterSize="s" style={{ flexGrow: 0, paddingTop: '4px' }}>
          <EuiHeaderLinks data-test-subj="text2dash-top-nav">
            <EuiText size="s">
              {i18n.translate('dashboardAssistant.feature.text2dash.title', {
                defaultMessage: 'New Dashboard',
              })}
            </EuiText>
          </EuiHeaderLinks>
          {getInputSection()}
        </EuiFlexGroup>
      </MountPointPortal>
      {!useUpdatedUX && (
        <>
          <EuiFlexGroup alignItems="center" gutterSize="s" style={{ flexGrow: 0 }}>
            {getInputSection()}
          </EuiFlexGroup>
          <EuiSpacer size="s" />
        </>
      )}
      <EuiPageBody>
        {panelStatus === 'INSIGHTS_LOADING' && (
          <EuiEmptyPrompt
            icon={<EuiLoadingLogo logo="visPie" size="xl" />}
            title={<h2>Generating Insights</h2>}
          />
        )}
        {panelStatus === 'INSIGHTS_LOADED' && (
          <>
            {Object.keys(dataInsights).map((key) => (
              <CheckableDataList
                key={key}
                title={key}
                items={dataInsights[key]}
                selection={selectedInsights}
                onToggle={onToggle}
              />
            ))}
          </>
        )}
        {(panelStatus === 'DASHBOARDS_CREATING' || panelStatus === 'DASHBOARDS_CREATED') && (
          <EuiCommentList comments={updateMessages} />
        )}
        {panelStatus === 'DASHBOARDS_CREATING' && <EuiLoadingContent lines={2} />}
        {panelStatus === 'DASHBOARDS_CREATING' && <EuiProgress size="xs" color="accent" />}
        {panelStatus !== 'INSIGHTS_LOADING' && (
          <>
            <EuiFlexGroup justifyContent="flexEnd">
              <EuiFlexItem grow={false}>
                <EuiButton
                  fill
                  onClick={onGenerate}
                  isLoading={panelStatus === 'DASHBOARDS_CREATING'}
                  isDisabled={selectedInsights.length === 0 || !indexPattern}
                >
                  Generate dashboard
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}
      </EuiPageBody>
    </EuiPage>
  );
};
