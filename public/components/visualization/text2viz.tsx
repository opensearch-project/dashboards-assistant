/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiIcon,
  EuiButtonIcon,
  EuiBreadcrumb,
  EuiHeaderLinks,
  EuiResizableContainer,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { v4 as uuidv4 } from 'uuid';

import { useCallback } from 'react';
import { useObservable } from 'react-use';
import { useLocation, useParams } from 'react-router-dom';
import { SourceSelector } from './source_selector';
import type { IndexPattern } from '../../../../../src/plugins/data/public';
import chatIcon from '../../assets/chat.svg';
import { EmbeddableRenderer } from '../../../../../src/plugins/embeddable/public';
import {
  useOpenSearchDashboards,
  MountPointPortal,
  toMountPoint,
} from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { StartServices } from '../../types';
import './text2viz.scss';
import { Text2VizEmpty } from './text2viz_empty';
import { Text2VizLoading } from './text2viz_loading';
import { Text2Vega } from './text2vega';
import {
  OnSaveProps,
  SavedObjectSaveModalOrigin,
} from '../../../../../src/plugins/saved_objects/public';
import { getVisNLQSavedObjectLoader } from '../../vis_nlq/saved_object_loader';
import { VisNLQSavedObject } from '../../vis_nlq/types';
import { getIndexPatterns } from '../../services';
import { NLQ_VISUALIZATION_EMBEDDABLE_TYPE } from './embeddable/nlq_vis_embeddable';
import { NLQVisualizationInput } from './embeddable/types';
import { EditorPanel } from './editor_panel';
import { VIS_NLQ_APP_ID, VIS_NLQ_SAVED_OBJECT } from '../../../common/constants/vis_type_nlq';
import { HeaderVariant } from '../../../../../src/core/public';
import { TEXT2VEGA_INPUT_SIZE_LIMIT } from '../../../common/constants/llm';
import { FeedbackThumbs } from '../feedback_thumbs';
import { VizStyleEditor } from './viz_style_editor';

export const INDEX_PATTERN_URL_SEARCH_KEY = 'indexPatternId';
export const ASSISTANT_INPUT_URL_SEARCH_KEY = 'assistantInput';

export const Text2Viz = () => {
  const { savedObjectId } = useParams<{ savedObjectId?: string }>();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [selectedSource, setSelectedSource] = useState(
    searchParams.get(INDEX_PATTERN_URL_SEARCH_KEY) ?? ''
  );
  const [savedObjectLoading, setSavedObjectLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    services: {
      application,
      chrome,
      embeddable,
      http,
      notifications,
      setHeaderActionMenu,
      overlays,
      data,
      uiSettings,
      savedObjects,
      config,
      usageCollection,
    },
  } = useOpenSearchDashboards<StartServices>();

  /**
   * Report metrics when the application is loaded
   */
  useEffect(() => {
    if (usageCollection) {
      usageCollection.reportUiStats(
        VIS_NLQ_APP_ID,
        usageCollection.METRIC_TYPE.LOADED,
        `app_loaded-${uuidv4()}`
      );
    }
  }, [usageCollection]);

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  const [inputQuestion, setInputQuestion] = useState(
    searchParams.get(ASSISTANT_INPUT_URL_SEARCH_KEY) ?? ''
  );
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [editorInput, setEditorInput] = useState('');
  const text2vegaRef = useRef(new Text2Vega(http, data.search, savedObjects));

  const status = useObservable(text2vegaRef.current.status$);

  const vegaSpec = useMemo(() => {
    if (!editorInput) {
      return undefined;
    }

    try {
      return JSON.parse(editorInput);
    } catch (e) {
      // TODO: handle error state
      return undefined;
    }
  }, [editorInput]);

  /**
   * The index pattern of current generated visualization used
   */
  const currentUsedIndexPatternRef = useRef<IndexPattern>();

  /**
   * Subscribe to text to visualization result changes
   */
  useEffect(() => {
    const text2vega = text2vegaRef.current;
    const subscription = text2vega.getResult$().subscribe((result) => {
      if (result) {
        if (result.error) {
          notifications.toasts.addError(result.error, {
            title: i18n.translate('dashboardAssistant.feature.text2viz.error', {
              defaultMessage: 'Error while executing text to visualization',
            }),
          });
        } else {
          setEditorInput(JSON.stringify(result, undefined, 4));

          // Report metric when visualization generated successfully
          if (usageCollection) {
            usageCollection.reportUiStats(
              VIS_NLQ_APP_ID,
              usageCollection.METRIC_TYPE.LOADED,
              `generated-${uuidv4()}`
            );
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [http, notifications, usageCollection]);

  /**
   * Loads the saved object from id when editing an existing visualization
   */
  useEffect(() => {
    if (savedObjectId) {
      const loader = getVisNLQSavedObjectLoader();
      setSavedObjectLoading(true);
      loader
        .get(savedObjectId)
        .then((savedVis) => {
          if (savedVis?.visualizationState) {
            const spec = JSON.parse(savedVis.visualizationState ?? '{}').params?.spec;
            const indexId = savedVis.searchSourceFields?.index;
            if (spec) {
              setEditorInput(JSON.stringify(spec, undefined, 4));
            }
            if (indexId) {
              setSelectedSource(indexId);
            }
          }
          if (savedVis?.uiState) {
            setInputQuestion(JSON.parse(savedVis.uiState ?? '{}').input);
          }
        })
        .catch(() => {
          notifications.toasts.addDanger({
            title: i18n.translate('dashboardAssistant.feature.text2viz.loadFailed', {
              defaultMessage: `Failed to load saved object: '{title}'`,
              values: {
                title: savedObjectId,
              },
            }),
          });
        })
        .finally(() => {
          setSavedObjectLoading(false);
        });
    }
  }, [savedObjectId, notifications]);

  /**
   * Submit user's natural language input to generate visualization
   */
  const onSubmit = useCallback(
    async (inputInstruction: string = '') => {
      setCurrentInstruction(inputInstruction);

      if (status === 'RUNNING' || !selectedSource) return;

      if (
        inputQuestion.trim().length > TEXT2VEGA_INPUT_SIZE_LIMIT ||
        inputInstruction.trim().length > TEXT2VEGA_INPUT_SIZE_LIMIT
      ) {
        notifications.toasts.addDanger({
          title: i18n.translate('dashboardAssistant.feature.text2viz.invalidInput', {
            defaultMessage:
              'Input size exceed limit: {limit}. Actual size: question({inputQuestionLength}), instruction({inputInstructionLength})',
            values: {
              limit: TEXT2VEGA_INPUT_SIZE_LIMIT,
              inputQuestionLength: inputQuestion.trim().length,
              inputInstructionLength: inputInstruction.trim().length,
            },
          }),
        });
        return;
      }

      setSubmitting(true);

      const indexPatterns = getIndexPatterns();
      const indexPattern = await indexPatterns.get(selectedSource);
      currentUsedIndexPatternRef.current = indexPattern;

      const text2vega = text2vegaRef.current;
      text2vega.invoke({
        index: indexPattern.title,
        inputQuestion,
        inputInstruction,
        dataSourceId: indexPattern.dataSourceRef?.id,
      });

      setSubmitting(false);
    },
    [selectedSource, inputQuestion, status, notifications.toasts]
  );

  /**
   * Display the save visualization dialog to persist the current generated visualization
   */
  const onSaveClick = useCallback(async () => {
    if (!vegaSpec || !selectedSource) return;

    const doSave = async (onSaveProps: OnSaveProps) => {
      const indexPattern = currentUsedIndexPatternRef.current;
      const loader = getVisNLQSavedObjectLoader();
      const savedVis: VisNLQSavedObject = await loader.get();

      savedVis.visualizationState = JSON.stringify({
        title: onSaveProps.newTitle,
        type: 'vega-lite',
        params: {
          spec: vegaSpec,
        },
      });
      savedVis.uiState = JSON.stringify({
        input: inputQuestion,
      });
      savedVis.searchSourceFields = { index: indexPattern };
      savedVis.title = onSaveProps.newTitle;
      savedVis.description = onSaveProps.newDescription;
      savedVis.copyOnSave = onSaveProps.newCopyOnSave;
      savedVis.id = savedObjectId ?? '';

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

          // Report metric when a new visualization is saved.
          if (usageCollection) {
            usageCollection.reportUiStats(
              VIS_NLQ_APP_ID,
              usageCollection.METRIC_TYPE.LOADED,
              `saved-${uuidv4()}`
            );
          }
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
          documentInfo={{
            id: savedObjectId ?? '',
            title: vegaSpec.title ?? '',
            description: vegaSpec.description,
          }}
          objectType={VIS_NLQ_SAVED_OBJECT}
          onClose={() => dialog.close()}
          onSave={doSave}
        />
      )
    );
  }, [
    notifications,
    vegaSpec,
    inputQuestion,
    overlays,
    selectedSource,
    savedObjectId,
    usageCollection,
  ]);

  const pageTitle = savedObjectId
    ? i18n.translate('dashboardAssistant.feature.text2viz.breadcrumbs.editVisualization', {
        defaultMessage: 'Edit visualization',
      })
    : i18n.translate('dashboardAssistant.feature.text2viz.breadcrumbs.newVisualization', {
        defaultMessage: 'New visualization',
      });

  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: i18n.translate('dashboardAssistant.feature.text2viz.breadcrumbs.visualize', {
          defaultMessage: 'Visualize',
        }),
        onClick: () => {
          application.navigateToApp('visualize');
        },
      },
    ];
    if (!useUpdatedUX) {
      breadcrumbs.push({
        text: pageTitle,
      });
    }
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, application, pageTitle, useUpdatedUX]);

  const visInput: NLQVisualizationInput = useMemo(() => {
    return {
      id: 'text2viz',
      title: vegaSpec?.title ?? '',
      visInput: {
        title: vegaSpec?.title ?? '',
        visualizationState: JSON.stringify({
          title: vegaSpec?.title ?? '',
          type: 'vega-lite',
          params: {
            spec: vegaSpec,
          },
        }),
      },
      savedObjectId: savedObjectId ?? '',
    };
  }, [vegaSpec, savedObjectId]);

  useEffect(() => {
    chrome.setHeaderVariant(HeaderVariant.APPLICATION);
    return () => {
      chrome.setHeaderVariant();
    };
  }, [chrome]);

  const factory = embeddable.getEmbeddableFactory<NLQVisualizationInput>(
    NLQ_VISUALIZATION_EMBEDDABLE_TYPE
  );

  const getInputSection = () => {
    return (
      <>
        <EuiFlexItem grow={3} style={{ maxWidth: '30%' }}>
          <SourceSelector
            selectedSourceId={selectedSource}
            onChange={(ds) => setSelectedSource(ds.value)}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={8}>
          <EuiFieldText
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            fullWidth
            compressed
            prepend={<EuiIcon type={config.branding.logo || chatIcon} />}
            placeholder="Generate visualization with a natural language question."
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            disabled={!selectedSource}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            aria-label="submit"
            onClick={() => onSubmit()}
            isDisabled={loading || inputQuestion.trim().length === 0 || !selectedSource}
            display="base"
            size="s"
            iconType="returnKey"
          />
        </EuiFlexItem>
      </>
    );
  };

  const loading = status === 'RUNNING' || savedObjectLoading || submitting;
  const noResult = !loading && status === 'STOPPED' && !vegaSpec && !savedObjectLoading;
  const resultLoaded = !loading && status === 'STOPPED' && vegaSpec;

  return (
    <EuiPage className="text2viz__page" direction="column">
      <MountPointPortal setMountPoint={setHeaderActionMenu}>
        <EuiFlexGroup alignItems="center" gutterSize="s" style={{ flexGrow: 0 }}>
          <EuiHeaderLinks data-test-subj="text2viz-top-nav">
            {useUpdatedUX && <EuiText size="s">{pageTitle}</EuiText>}
            <EuiButtonIcon
              title={i18n.translate('dashboardAssistant.feature.text2viz.save', {
                defaultMessage: 'Save',
              })}
              aria-label="save"
              display="base"
              iconType="save"
              size="s"
              color={useUpdatedUX ? 'text' : 'primary'}
              onClick={onSaveClick}
              isDisabled={!vegaSpec || loading}
            />
          </EuiHeaderLinks>
          {useUpdatedUX && getInputSection()}
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
      {noResult && <Text2VizEmpty />}
      {loading && <Text2VizLoading type={savedObjectLoading ? 'loading' : 'generating'} />}
      {resultLoaded && factory && (
        <EuiResizableContainer style={{ flexGrow: 1, flexShrink: 1 }}>
          {(EuiResizablePanel, EuiResizableButton) => {
            return (
              <>
                <EuiResizablePanel
                  style={{ paddingRight: 8 }}
                  mode="main"
                  initialSize={70}
                  minSize="50%"
                  paddingSize="none"
                  scrollable={false}
                >
                  <EuiFlexGroup className="text2viz__actionContainer" gutterSize="none">
                    {usageCollection ? (
                      <EuiFlexItem className="text2viz__feedbackContainer">
                        <FeedbackThumbs
                          usageCollection={usageCollection}
                          appName={VIS_NLQ_APP_ID}
                        />
                      </EuiFlexItem>
                    ) : null}
                    <EuiFlexItem className="text2viz__vizStyleEditorContainer">
                      <VizStyleEditor
                        iconType={config.branding.logo || chatIcon}
                        onApply={(instruction) => onSubmit(instruction)}
                        value={currentInstruction}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EmbeddableRenderer factory={factory} input={visInput} />
                </EuiResizablePanel>
                <EuiResizableButton />
                <EuiResizablePanel
                  style={{ paddingLeft: 8 }}
                  paddingSize="none"
                  mode={['collapsible', { position: 'top' }]}
                  initialSize={30}
                  minSize="0px"
                  scrollable={false}
                >
                  <EditorPanel originalValue={editorInput} onApply={(v) => setEditorInput(v)} />
                </EuiResizablePanel>
              </>
            );
          }}
        </EuiResizableContainer>
      )}
    </EuiPage>
  );
};
