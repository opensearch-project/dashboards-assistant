/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import React, { useEffect, useState } from 'react';
import { escape } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  EuiIconTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiSplitPanel,
} from '@elastic/eui';
import { getNotifications } from '../../services';
import { getAssistantRole } from '../../utils/constants';
import { SUMMARY_ASSISTANT_API } from '../../../common/constants/llm';
import { HttpSetup } from '../../../../../src/core/public';
import sparkleSvg from '../../assets/sparkle.svg';

interface VizSummaryProps {
  http: HttpSetup;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sampleData$: BehaviorSubject<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vizParams?: any;
  dataSourceId?: string;
}

export const VizSummary: React.FC<VizSummaryProps> = React.memo(
  ({ http, sampleData$, vizParams, dataSourceId }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [sampleSize, setSampleSize] = useState<number>(0);

    useEffect(() => {
      const subscription = sampleData$.subscribe(async (sampleData) => {
        setSummary(null);
        setSampleSize(0);
        if (sampleData && vizParams) {
          setIsGenerating(true);
          setSampleSize(sampleData.size);

          try {
            const response = await http.post(SUMMARY_ASSISTANT_API.SUMMARIZE_VIZ, {
              body: JSON.stringify({
                vizData: escape(JSON.stringify(sampleData)),
                vizParams: vizParams ? escape(JSON.stringify(vizParams)) : '',
                prompt: getAssistantRole('vizSummary'),
              }),
              query: { dataSourceId },
            });
            setSummary(response);
          } catch (error) {
            getNotifications().toasts.addDanger({
              title: i18n.translate(
                'dashboardAssistant.feature.generatedResponse.generateFailure',
                {
                  defaultMessage: `Error on generating response`,
                }
              ),
            });
            setSummary(null);
          } finally {
            setIsGenerating(false);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [http, sampleData$, vizParams, dataSourceId]);

    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiSplitPanel.Outer>
              <EuiSplitPanel.Inner
                style={{ background: 'linear-gradient(to left, #EDF7FF, #F9F4FF)', padding: '6px' }}
              >
                <EuiFlexGroup alignItems={'center'} gutterSize={'xs'}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type={sparkleSvg} size="l" />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">
                      <strong>
                        {i18n.translate('assistantDashboards.vizSummary.response', {
                          defaultMessage: 'Response',
                        })}
                      </strong>
                    </EuiText>
                  </EuiFlexItem>
                  {summary && (
                    <EuiFlexItem grow={true}>
                      <EuiFlexGroup
                        alignItems={'center'}
                        justifyContent={'flexEnd'}
                        gutterSize={'xs'}
                      >
                        <EuiFlexItem grow={false}>
                          <EuiIconTip
                            type={'iInCircle'}
                            content={'Generated summary of the first 50 ppl sample data'}
                            aria-label={i18n.translate(
                              'assistantDashboards.vizSummary.sampleDataTip',
                              {
                                defaultMessage: 'Generated summary of the first 50 ppl sample data',
                              }
                            )}
                          />
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size={'s'}>
                            {i18n.translate('assistantDashboards.vizSummary.sampleSize', {
                              defaultMessage: 'Sample size: {sampleSize}',
                              values: { sampleSize },
                            })}
                          </EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </EuiSplitPanel.Inner>
              <EuiSplitPanel.Inner paddingSize={'s'}>
                {!summary && !isGenerating && (
                  <EuiText size="s">Ask a question to generate a summary.</EuiText>
                )}
                {isGenerating && <EuiText size="s">Generating response...</EuiText>}
                {summary && <EuiText size="s">{summary}</EuiText>}
              </EuiSplitPanel.Inner>
            </EuiSplitPanel.Outer>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
);
