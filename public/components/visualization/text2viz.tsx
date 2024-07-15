/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiPageBody,
  EuiPage,
  EuiPageContent,
  EuiPageHeader,
  EuiPageContentBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiIcon,
  EuiButtonIcon,
  EuiButton,
  EuiSpacer,
} from '@elastic/eui';
import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';

import { useCallback } from 'react';
import { useObservable } from 'react-use';
import { useMemo } from 'react';
import { SourceSelector } from './source_selector';
import type { DataSourceOption } from '../../../../../src/plugins/data/public';
import chatIcon from '../../assets/chat.svg';
import { EmbeddableRenderer } from '../../../../../src/plugins/embeddable/public';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { StartServices } from '../../types';
import {
  VISUALIZE_EMBEDDABLE_TYPE,
  VisualizeInput,
} from '../../../../../src/plugins/visualizations/public';
import './text2viz.scss';
import { Text2VizEmpty } from './text2viz_empty';
import { Text2VizLoading } from './text2viz_loading';
import { Text2Vega } from './text2vega';

export const Text2Viz = () => {
  const [selectedSource, setSelectedSource] = useState<DataSourceOption>();
  const {
    services: { embeddable, visualizations, http, notifications },
  } = useOpenSearchDashboards<StartServices>();
  const [input, setInput] = useState('');
  const [vegaSpec, setVegaSpec] = useState('');
  const text2vegaRef = useRef(new Text2Vega(http));
  const status = useObservable(text2vegaRef.current.status$);

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
          setVegaSpec(JSON.stringify(result, null, 4));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [http, notifications]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    [selectedSource]
  );

  const onSubmit = useCallback(() => {
    const text2vega = text2vegaRef.current;
    if (selectedSource?.label) {
      text2vega.invoke({ index: selectedSource?.label, prompt: input });
    }
  }, [selectedSource, input]);

  const factory = embeddable.getEmbeddableFactory<VisualizeInput>(VISUALIZE_EMBEDDABLE_TYPE);
  const vis = useMemo(() => {
    return visualizations.convertToSerializedVis({
      title: 'vega',
      visState: {
        title: 'vega',
        type: 'vega',
        aggs: [],
        params: {
          spec: vegaSpec,
        },
      },
    });
  }, [vegaSpec]);

  return (
    <EuiPage className="text2viz__page">
      <EuiPageBody>
        <EuiPageHeader pageTitle="New visualization" />
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
            </EuiFlexGroup>
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
            {status === 'STOPPED' && Boolean(vegaSpec) && (
              <EuiFlexGroup alignItems="stretch" gutterSize="s" direction="column">
                <EuiFlexItem grow={1}>
                  {factory && (
                    <EmbeddableRenderer
                      factory={factory}
                      input={{ id: 'text2viz', savedVis: vis }}
                    />
                  )}
                </EuiFlexItem>
                <EuiFlexItem grow={1}>
                  <div className="text2viz__right" style={{ height: '100%' }}>
                    <EuiButton fill color="success">
                      {i18n.translate('dashboardAssistant.feature.text2viz.save', {
                        defaultMessage: 'Save',
                      })}
                    </EuiButton>
                  </div>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
