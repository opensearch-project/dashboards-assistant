/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiPageBody,
  EuiPage,
  EuiPageContent,
  EuiPageContentBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiIcon,
  EuiButtonIcon,
  EuiButton,
  EuiBreadcrumb,
  EuiHeaderLinks,
} from '@elastic/eui';
import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';

import { useCallback } from 'react';
import { useObservable } from 'react-use';
import { useMemo } from 'react';
import { BehaviorSubject } from 'rxjs';
import { SourceSelector } from './source_selector';
import type { DataSourceOption } from '../../../../../src/plugins/data/public';
import chatIcon from '../../assets/chat.svg';
import { EmbeddableRenderer } from '../../../../../src/plugins/embeddable/public';
import {
  useOpenSearchDashboards,
  MountPointPortal,
  toMountPoint,
} from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { StartServices } from '../../types';
import {
  VISUALIZE_EMBEDDABLE_TYPE,
  VisSavedObject,
  VisualizeInput,
} from '../../../../../src/plugins/visualizations/public';
import './text2viz.scss';
import { Text2VizEmpty } from './text2viz_empty';
import { Text2VizLoading } from './text2viz_loading';
import { Text2Vega, topN } from './text2vega';
import {
  OnSaveProps,
  SavedObjectSaveModalOrigin,
} from '../../../../../src/plugins/saved_objects/public';
import { VizSummary } from './viz_summary';

export const Text2Viz = () => {
  const [selectedSource, setSelectedSource] = useState<DataSourceOption>();
  const {
    services: {
      application,
      chrome,
      embeddable,
      visualizations,
      http,
      notifications,
      setHeaderActionMenu,
      overlays,
      data,
    },
  } = useOpenSearchDashboards<StartServices>();
  const [input, setInput] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vegaSpec, setVegaSpec] = useState<Record<string, any>>();
  const text2vegaRef = useRef(new Text2Vega(http, data.search));
  const status = useObservable(text2vegaRef.current.status$);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sampleData$ = useRef(new BehaviorSubject<any>(null));
  const [dataSourceId, setDataSourceId] = useState<string | undefined>(undefined);
  const [showVizSummary, setShowVizSummary] = useState<boolean>(true); // By default, we enable to show the visualization summary.

  useEffect(() => {
    const text2vega = text2vegaRef.current;
    const subscription = text2vega.getResult$().subscribe((result) => {
      if (result) {
        if (result.error) {
          notifications.toasts.addError(result.error, {
            title: i18n.translate('dashboardAssistant.feature.text2viz.error', {
              defaultMessage: 'Error while executing text to vega',
            }),
          });
        } else {
          setVegaSpec(result);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [http, notifications]);

  useEffect(() => {
    const fetchData = async () => {
      if (vegaSpec) {
        // Today's ppl query could return at most 10000 rows, make a safe limit to avoid data explosion of llm input for now
        const ppl = topN(vegaSpec.data.url.body.query, 200);

        try {
          const sampleData = await data.search
            .search({ params: { body: { query: ppl } }, dataSourceId }, { strategy: 'pplraw' })
            .toPromise();

          sampleData$.current.next(sampleData.rawResponse);
        } catch (error) {
          notifications.toasts.addError(error, {
            title: i18n.translate('dashboardAssistant.feature.vizSummary.fetchData.error', {
              defaultMessage: 'Error while fetching data to summarize visualization',
            }),
          });
        }
      }
    };

    fetchData();
  }, [data.search, vegaSpec]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const onSubmit = useCallback(async () => {
    setVegaSpec(undefined);
    setDataSourceId(undefined);
    sampleData$.current.next(undefined);
    const text2vega = text2vegaRef.current;
    if (selectedSource?.label) {
      const dataSource = (await selectedSource.ds.getDataSet()).dataSets.find(
        (ds) => ds.title === selectedSource.label
      );
      setDataSourceId(dataSource?.dataSourceId);
      text2vega.invoke({
        index: selectedSource.label,
        prompt: input,
        dataSourceId: dataSource?.dataSourceId,
      });
    }
  }, [selectedSource, input]);

  const factory = embeddable.getEmbeddableFactory<VisualizeInput>(VISUALIZE_EMBEDDABLE_TYPE);
  const vis = useMemo(() => {
    return vegaSpec
      ? visualizations.convertToSerializedVis({
          title: vegaSpec?.title ?? 'vega',
          description: vegaSpec?.description ?? '',
          visState: {
            title: vegaSpec?.title ?? 'vega',
            type: 'vega',
            aggs: [],
            params: {
              spec: JSON.stringify(vegaSpec, null, 4),
            },
          },
        })
      : null;
  }, [vegaSpec]);

  const onSaveClick = useCallback(async () => {
    if (!vis) return;

    const doSave = async (onSaveProps: OnSaveProps) => {
      const savedVis: VisSavedObject = await visualizations.savedVisualizationsLoader.get(); // .createVis('vega', vis)
      savedVis.visState = {
        title: onSaveProps.newTitle,
        type: vis.type,
        params: vis.params,
        aggs: [],
      };
      savedVis.title = onSaveProps.newTitle;
      savedVis.description = onSaveProps.newDescription;
      savedVis.copyOnSave = onSaveProps.newCopyOnSave;
      try {
        const id = await savedVis.save({
          isTitleDuplicateConfirmed: onSaveProps.isTitleDuplicateConfirmed,
          onTitleDuplicate: onSaveProps.onTitleDuplicate,
        });
        if (id) {
          notifications.toasts.addSuccess({
            title: i18n.translate('dashboardAssistant.feature.text2viz.saveSuccess', {
              defaultMessage: `Saved '{title}'`,
              values: {
                title: savedVis.title,
              },
            }),
          });
          dialog.close();
        }
      } catch (e) {
        notifications.toasts.addDanger({
          title: i18n.translate('dashboardAssistant.feature.text2viz.saveFail', {
            defaultMessage: `Error on saving '{title}'`,
            values: {
              title: savedVis.title,
            },
          }),
        });
      }
    };

    const dialog = overlays.openModal(
      toMountPoint(
        <SavedObjectSaveModalOrigin
          documentInfo={{ title: vis.title, description: vis.description }}
          objectType={'visualization'}
          onClose={() => dialog.close()}
          onSave={doSave}
        />
      )
    );
  }, [vis, visualizations, notifications]);

  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: 'Visualize',
        onClick: () => {
          application.navigateToApp('visualize');
        },
      },
      {
        text: 'Create',
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, application]);

  return (
    <EuiPage className="text2viz__page">
      <MountPointPortal setMountPoint={setHeaderActionMenu}>
        <EuiHeaderLinks data-test-subj="text2viz-top-nav">
          <EuiButton
            size="s"
            color="primary"
            onClick={onSaveClick}
            isDisabled={!vis || status === 'RUNNING'}
          >
            {i18n.translate('dashboardAssistant.feature.text2viz.save', {
              defaultMessage: 'Save',
            })}
          </EuiButton>
        </EuiHeaderLinks>
      </MountPointPortal>
      <EuiPageBody>
        <EuiPageContent
          hasBorder={false}
          hasShadow={false}
          paddingSize="none"
          color="transparent"
          borderRadius="none"
        >
          <EuiPageContentBody>
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem grow={3}>
                <SourceSelector
                  selectedSourceId={selectedSource?.value ?? ''}
                  onChange={(ds) => setSelectedSource(ds)}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={8}>
                <EuiFieldText
                  value={input}
                  onChange={onInputChange}
                  fullWidth
                  prepend={<EuiIcon type={chatIcon} />}
                  placeholder="Generate visualization with a natural language question."
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  aria-label="submit"
                  onClick={onSubmit}
                  isDisabled={status === 'RUNNING'}
                  display="base"
                  size="m"
                  color="success"
                  iconType="returnKey"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  aria-label="show visualization summary"
                  iconType={showVizSummary ? 'starFilled' : 'starEmpty'} // TODO: use the same customized icon as UI mockup
                  onClick={() => {
                    setShowVizSummary((isOn) => !isOn);
                  }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            {showVizSummary && (
              <VizSummary
                http={http}
                sampleData$={sampleData$.current}
                vizParams={vegaSpec}
                dataSourceId={dataSourceId}
              />
            )}
            {status === 'STOPPED' && !vegaSpec && (
              <EuiFlexGroup>
                <EuiFlexItem>
                  <Text2VizEmpty />
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
            {status === 'RUNNING' && (
              <EuiFlexGroup>
                <EuiFlexItem>
                  <Text2VizLoading />
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
            {status === 'STOPPED' && vis && (
              <EuiFlexGroup alignItems="stretch" gutterSize="s" direction="column">
                <EuiFlexItem grow={1}>
                  {factory && (
                    <EmbeddableRenderer
                      factory={factory}
                      input={{ id: 'text2viz', savedVis: vis }}
                    />
                  )}
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
