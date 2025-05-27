/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';

import {
  EuiBadge,
  EuiSmallButton,
  EuiCommentList,
  EuiCommentProps,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingLogo,
  EuiPage,
  EuiPageBody,
  EuiText,
  EuiBreadcrumb,
  EuiHeaderLinks,
  EuiSpacer,
  EuiTitle,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiModalHeader,
  EuiModalBody,
  EuiModalFooter,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useLocation } from 'react-router-dom';
import { HeaderVariant } from '../../../../../src/core/public';
import { IndexPattern } from '../../../../../src/plugins/data/public';
import { Pipeline } from '../../utils/pipeline/pipeline';
import { PPLSampleTask } from '../../utils/pipeline/ppl_sample_task';
import { DataInsightsTask } from '../../utils/pipeline/data_insights_task';
import { CheckableDataList } from './checkable_data_list';
import { Text2PPLTask } from '../../utils/pipeline/text_to_ppl_task';
import { Text2VegaTask } from '../../utils/pipeline/text_to_vega_task';
import { getVisNLQSavedObjectLoader } from '../../vis_nlq/saved_object_loader';
import { VisNLQSavedObject } from '../../vis_nlq/types';
import { createDashboard } from './create_dashboard';
import {
  toMountPoint,
  useOpenSearchDashboards,
} from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { MountPointPortal } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { StartServices } from '../../types';
import { SourceSelector } from '../visualization/source_selector';
import './input_panel.scss';

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
      overlays,
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
  const useUpdatedUX = uiSettings.get('home:useNewHomePage');
  const indexInIndexPattern = indexPattern?.getIndex();

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

  useEffect(() => {
    if (!indexInIndexPattern || !dataSourceId) {
      return;
    }
    const dataInsightsPipeline = new Pipeline([
      new PPLSampleTask(data.search),
      new DataInsightsTask(http),
    ]);

    const subscriptions = [
      dataInsightsPipeline.status$.subscribe({
        next: (status) => {
          setPanelStatus(status === 'RUNNING' ? 'INSIGHTS_LOADING' : 'INSIGHTS_LOADED');
        },
        error: (err) => {
          setPanelStatus('INSIGHTS_LOADED');
          notifications.toasts.addDanger({
            title: i18n.translate('dashboardAssistant.feature.text2dash.insightsFailed', {
              defaultMessage: 'Failed to generate insights',
            }),
            text: err.message || 'An error occurred while generating insights',
          });
        },
        complete: () => {
          console.log('Pipeline status$ completed');
        },
      }),
      dataInsightsPipeline.output$.subscribe({
        next: (output) => {
          setDataInsights(output.dataInsights);
        },
        error: (err) => {
          notifications.toasts.addDanger({
            title: i18n.translate('dashboardAssistant.feature.text2dash.insightsFailed', {
              defaultMessage: 'Failed to generate insights',
            }),
            text: err.message || 'An error occurred while generating insights',
          });
        },
        complete: () => {
          console.log('Pipeline output$ completed');
        },
      }),
    ];

    dataInsightsPipeline.run({
      ppl: `source=${indexInIndexPattern}`,
      dataSourceId,
    });
    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [indexInIndexPattern, dataSourceId, notifications.toasts.addDanger]);

  const onToggle = useCallback((item: string) => {
    setSelectedInsights((prevSelectedInsights) => {
      const selection = new Set(prevSelectedInsights);
      if (selection.has(item)) {
        selection.delete(item);
      } else {
        selection.add(item);
      }
      return [...selection];
    });
  }, []);

  const onSelectAll = useCallback(() => {
    const allInsights = Object.values(dataInsights).flat();
    const allSelected = allInsights.every((insight) => selectedInsights.includes(insight));
    if (allSelected) {
      setSelectedInsights([]);
    } else {
      setSelectedInsights(allInsights);
    }
  }, [dataInsights, selectedInsights]);

  const onSelectAllForCategory = useCallback(
    (category: string) => {
      setSelectedInsights((prevSelectedInsights) => {
        const categoryInsights = dataInsights[category] || [];
        const allSelectedInCategory = categoryInsights.every((insight) =>
          prevSelectedInsights.includes(insight)
        );
        const selection = new Set(prevSelectedInsights);

        if (allSelectedInCategory) {
          categoryInsights.forEach((insight) => selection.delete(insight));
        } else {
          categoryInsights.forEach((insight) => selection.add(insight));
        }

        return [...selection];
      });
    },
    [dataInsights]
  );

  const onGenerate = useCallback(async () => {
    if (!indexPattern) return;
    setPanelStatus('DASHBOARDS_CREATING');
    const initialMessage: EuiCommentProps = {
      username: 'Dashboards assistant',
      event: 'started to create visualization',
      type: 'update',
      timelineIcon: 'sparkleFilled',
    };
    setUpdateMessages([initialMessage]);
    const newMessages: EuiCommentProps[] = [initialMessage];
    const visualizations: Array<{ id: string; type: string }> = [];
    let successCount = 0;
    let failureCount = 0;

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

        const newMessage: EuiCommentProps = {
          username: i18n.translate('dashboardAssistant.feature.text2dash.assistantName', {
            defaultMessage: 'Dashboards assistant',
          }),
          event: (
            <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiText>
                  {i18n.translate('dashboardAssistant.feature.text2dash.createdVisualization', {
                    defaultMessage: 'created visualization',
                  })}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="success">
                  {i18n.translate('dashboardAssistant.feature.text2dash.success', {
                    defaultMessage: 'Success',
                  })}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          type: 'update',
          children: (
            <EuiText size="s">
              <p>
                {insight}{' '}
                <EuiLink href={url} target="_blank">
                  {i18n.translate('dashboardAssistant.feature.text2dash.viewLink', {
                    defaultMessage: 'view',
                  })}
                </EuiLink>
              </p>
            </EuiText>
          ),
          timelineIcon: 'check',
        };
        newMessages.push(newMessage);
        setUpdateMessages((prevMessages) => [...prevMessages, newMessage]);
        successCount++;
      } catch (e) {
        const newMessage: EuiCommentProps = {
          username: i18n.translate('dashboardAssistant.feature.text2dash.assistantName', {
            defaultMessage: 'Dashboards assistant',
          }),
          event: (
            <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiText>
                  {i18n.translate('dashboardAssistant.feature.text2dash.createdVisualization', {
                    defaultMessage: 'created visualization',
                  })}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="danger">
                  {i18n.translate('dashboardAssistant.feature.text2dash.fail', {
                    defaultMessage: 'Fail',
                  })}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          children: (
            <EuiText size="s">
              <p>{insight}</p>
            </EuiText>
          ),
          timelineIcon: 'cross',
        };
        newMessages.push(newMessage);
        setUpdateMessages((prevMessages) => [...prevMessages, newMessage]);
        failureCount++;
      }
    }

    const toastContent = (
      <div>
        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              color={failureCount > 0 ? 'warning' : 'success'}
              onClick={() => {
                const modal = overlays.openModal(
                  toMountPoint(
                    <>
                      <EuiModalHeader>
                        <EuiTitle size="m">
                          <h2>
                            {i18n.translate(
                              'dashboardAssistant.feature.text2dash.generationDetailsTitle',
                              {
                                defaultMessage: 'Generation details',
                              }
                            )}
                          </h2>
                        </EuiTitle>
                      </EuiModalHeader>
                      <EuiModalBody>
                        <EuiCommentList comments={newMessages} />
                      </EuiModalBody>
                      <EuiModalFooter className="text2dash__modalFooter">
                        <EuiSpacer size="m" />
                        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                          <EuiFlexItem grow={false}>
                            <EuiFlexGroup alignItems="center" gutterSize="s">
                              <EuiFlexItem grow={false}>
                                <EuiIcon type="help" color="subdued" />
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiText size="s" color="subdued">
                                  {i18n.translate(
                                    'dashboardAssistant.feature.text2dash.generationSummaryModal',
                                    {
                                      defaultMessage:
                                        '{successCount} succeeded, {failureCount} failed',
                                      values: { successCount, failureCount },
                                    }
                                  )}
                                </EuiText>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiSmallButton
                              className="text2dash__modalClose"
                              fill
                              onClick={() => modal.close()}
                            >
                              <EuiText size="s">
                                {i18n.translate(
                                  'dashboardAssistant.feature.text2dash.closeButton',
                                  {
                                    defaultMessage: 'Close',
                                  }
                                )}
                              </EuiText>
                            </EuiSmallButton>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiSpacer size="s" />
                      </EuiModalFooter>
                    </>
                  )
                );
              }}
            >
              {i18n.translate('dashboardAssistant.feature.text2dash.viewGenerationDetails', {
                defaultMessage: 'View generation details',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );

    if (failureCount > 0) {
      notifications.toasts.addWarning({
        title: i18n.translate('dashboardAssistant.feature.text2dash.generationWarning', {
          defaultMessage: '{successCount} succeeded, {failureCount} failed',
          values: { successCount, failureCount },
        }),
        text: toMountPoint(toastContent),
      });
    } else if (successCount > 0) {
      notifications.toasts.addSuccess({
        title: i18n.translate('dashboardAssistant.feature.text2dash.generationSuccess', {
          defaultMessage: 'All visualizations generated successfully',
        }),
        text: toMountPoint(toastContent),
      });
    }

    try {
      const dashboard = await createDashboard(visualizations);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      application.navigateToUrl(dashboard.url);
    } catch (e) {
      setUpdateMessages((messages) => [
        ...messages,
        {
          username: i18n.translate('dashboardAssistant.feature.text2dash.assistantName', {
            defaultMessage: 'Dashboards assistant',
          }),
          event: (
            <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiText>
                  {i18n.translate('dashboardAssistant.feature.text2dash.createdDashboard', {
                    defaultMessage: 'created dashboard',
                  })}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="danger">
                  {i18n.translate('dashboardAssistant.feature.text2dash.fail', {
                    defaultMessage: 'Fail',
                  })}
                </EuiBadge>
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

  const pageTitle = i18n.translate('dashboardAssistant.feature.text2dash.title', {
    defaultMessage: 'New dashboard',
  });

  // Set breadcrumbs
  useEffect(() => {
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
          <EuiFlexItem grow={2}>
            <SourceSelector
              selectedSourceId={indexPatternId}
              onChange={(ds) => {
                const url = new URL(
                  application.getUrlForApp('text2dash', {
                    absolute: true,
                    path: '/',
                  })
                );
                url.searchParams.set('indexPatternId', ds.value);
                const firstUnderscoreIndex = ds.value.indexOf('_');
                const secondUnderscoreIndex = ds.value.indexOf('_', firstUnderscoreIndex + 1);
                if (firstUnderscoreIndex === -1 || secondUnderscoreIndex === -1) {
                  throw new Error('Invalid ds.value format: missing underscores');
                }
                const dataSource = ds.value.slice(firstUnderscoreIndex + 1, secondUnderscoreIndex);
                if (dataSource) {
                  url.searchParams.set('dataSourceId', dataSource);
                }
                application.navigateToUrl(url.toString());
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  };

  return (
    <EuiPage className="text2dash__page" direction="column">
      <MountPointPortal setMountPoint={setHeaderActionMenu}>
        <EuiFlexGroup alignItems="center" gutterSize="s" className="text2dash__headerContainer">
          <EuiHeaderLinks data-test-subj="text2dash-top-nav">
            <EuiText size="xs">
              <h4>{pageTitle}</h4>
            </EuiText>
          </EuiHeaderLinks>
          {getInputSection()}
        </EuiFlexGroup>
      </MountPointPortal>
      <EuiPageBody>
        {panelStatus === 'INSIGHTS_LOADING' && (
          <EuiEmptyPrompt
            icon={<EuiLoadingLogo logo="visPie" size="xl" />}
            title={
              <EuiTitle size="m">
                <h2>
                  {i18n.translate('dashboardAssistant.feature.text2dash.exploringDataTitle', {
                    defaultMessage: 'Exploring data',
                  })}
                </h2>
              </EuiTitle>
            }
            className="text2dash__loadingPrompt"
          />
        )}
        {panelStatus === 'INSIGHTS_LOADED' && (
          <>
            <div className="text2dash__suggestionsHeader">
              <EuiTitle size="m">
                <h2>
                  {i18n.translate(
                    'dashboardAssistant.feature.text2dash.suggestedVisualizationsTitle',
                    {
                      defaultMessage: 'Suggested visualizations',
                    }
                  )}
                </h2>
              </EuiTitle>
              <EuiText size="s" color="subdued">
                {i18n.translate(
                  'dashboardAssistant.feature.text2dash.suggestedVisualizationDescription',
                  {
                    defaultMessage:
                      'Select visualizations that will help you explore the data. The visualizations will be generated by AI into a new dashboard.',
                  }
                )}
              </EuiText>
            </div>
            <EuiHorizontalRule margin="none" />
            <EuiFlexGroup justifyContent="flexEnd" className="text2dash__selectAllContainer">
              <EuiFlexItem grow={false}>
                <EuiLink
                  onClick={onSelectAll}
                  color="primary"
                  disabled={Object.keys(dataInsights).length === 0}
                >
                  <EuiText size="s">
                    {selectedInsights.length === Object.values(dataInsights).flat().length
                      ? i18n.translate('dashboardAssistant.feature.text2dash.deselectAll', {
                          defaultMessage: 'Deselect all',
                        })
                      : i18n.translate('dashboardAssistant.feature.text2dash.selectAll', {
                          defaultMessage: 'Select all',
                        })}
                  </EuiText>
                </EuiLink>
              </EuiFlexItem>
            </EuiFlexGroup>
            {Object.keys(dataInsights).map((key) => (
              <CheckableDataList
                key={key}
                title={key}
                items={dataInsights[key]}
                selection={selectedInsights}
                onToggle={onToggle}
                onSelectAllForCategory={() => onSelectAllForCategory(key)}
              />
            ))}
          </>
        )}
        {(panelStatus === 'DASHBOARDS_CREATING' || panelStatus === 'DASHBOARDS_CREATED') && (
          <>
            <EuiFlexGroup
              justifyContent="center"
              alignItems="center"
              className="text2dash__generatingContainer"
            >
              <EuiFlexItem grow={false}>
                <EuiLoadingSpinner size="xl" />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup
              justifyContent="center"
              alignItems="center"
              className="text2dash__generatingText"
            >
              <EuiText size="s">
                <h4>
                  {i18n.translate('dashboardAssistant.feature.text2dash.generatingResponse', {
                    defaultMessage: 'Generating response...',
                  })}
                </h4>
              </EuiText>
            </EuiFlexGroup>
            <EuiText size="s" className="text2dash__generationHeader">
              <h4>
                {i18n.translate('dashboardAssistant.feature.text2dash.generationDetailsHeader', {
                  defaultMessage: 'GENERATION DETAILS',
                })}
              </h4>
            </EuiText>
            <EuiHorizontalRule margin="xs" />
            <EuiCommentList comments={updateMessages} className="text2dash__generationDetails" />
          </>
        )}
        {panelStatus === 'INSIGHTS_LOADED' && (
          <EuiFlexGroup justifyContent="spaceBetween" className="text2dash__footerContainer">
            <EuiFlexItem grow={false}>
              <EuiText size="s" color="subdued">
                {selectedInsights.length === 0
                  ? ''
                  : selectedInsights.length === 1
                  ? i18n.translate('dashboardAssistant.feature.text2dash.oneInsightSelected', {
                      defaultMessage: '1 insight selected',
                    })
                  : i18n.translate(
                      'dashboardAssistant.feature.text2dash.multipleInsightsSelected',
                      {
                        defaultMessage: '{count} insights selected',
                        values: { count: selectedInsights.length },
                      }
                    )}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                fill
                onClick={onGenerate}
                isDisabled={selectedInsights.length === 0 || !indexPattern}
              >
                <EuiText size="s">
                  {i18n.translate('dashboardAssistant.feature.text2dash.generateDashboardButton', {
                    defaultMessage: 'Generate dashboard',
                  })}
                </EuiText>
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </EuiPageBody>
    </EuiPage>
  );
};
