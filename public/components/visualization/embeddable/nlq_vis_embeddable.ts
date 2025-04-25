/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { Subscription } from 'rxjs';

import { Embeddable, IContainer } from '../../../../../../src/plugins/embeddable/public';
import {
  ExpressionRenderError,
  ExpressionsStart,
  IExpressionLoaderParams,
} from '../../../../../../src/plugins/expressions/public';
import { TimefilterContract, TimeRange } from '../../../../../../src/plugins/data/public';
import { NLQVisualizationInput, NLQVisualizationOutput } from './types';
import { getExpressions } from '../../../services';
import { VIS_NLQ_APP_ID, VIS_NLQ_SAVED_OBJECT } from '../../../../common/constants/vis_type_nlq';
import { PersistedState } from '../../../../../../src/plugins/visualizations/public';

type ExpressionLoader = InstanceType<ExpressionsStart['ExpressionLoader']>;

interface NLQVisualizationEmbeddableConfig {
  editUrl: string;
  editPath: string;
  editable: boolean;
}

export const NLQ_VISUALIZATION_EMBEDDABLE_TYPE = VIS_NLQ_SAVED_OBJECT;

const escapeString = (data: string): string => {
  return data.replace(/\\/g, `\\\\`).replace(/'/g, `\\'`);
};

export class NLQVisualizationEmbeddable extends Embeddable<
  NLQVisualizationInput,
  NLQVisualizationOutput
> {
  public readonly type = NLQ_VISUALIZATION_EMBEDDABLE_TYPE;
  private handler?: ExpressionLoader;
  private domNode?: HTMLDivElement;
  private abortController?: AbortController;
  private timeRange?: TimeRange;
  private subscriptions: Subscription[] = [];
  private uiState: PersistedState;
  private visInput?: NLQVisualizationInput['visInput'];

  constructor(
    timeFilter: TimefilterContract,
    initialInput: NLQVisualizationInput,
    config?: NLQVisualizationEmbeddableConfig,
    parent?: IContainer
  ) {
    super(
      initialInput,
      {
        defaultTitle: initialInput.title,
        editPath: config?.editPath ?? '',
        editApp: VIS_NLQ_APP_ID,
        editUrl: config?.editUrl ?? '',
        editable: config?.editable,
        visTypeName: 'Natural Language Query',
      },
      parent
    );
    // TODO: right now, there is nothing in ui state will trigger visualization to reload, so we set it to empty
    // In the future, we may need to add something to ui state to trigger visualization to reload
    this.uiState = new PersistedState();
    this.visInput = initialInput.visInput;

    this.subscriptions.push(
      this.getInput$().subscribe(() => {
        this.handleChange();
      })
    );

    this.subscriptions.push(
      timeFilter.getAutoRefreshFetch$().subscribe(() => this.updateHandler())
    );
  }

  /**
   * Build expression for the visualization, it only supports vega type visualization now
   */
  private buildPipeline = async () => {
    if (!this.visInput?.visualizationState) {
      return '';
    }

    let pipeline = `opensearchDashboards | opensearch_dashboards_context `;
    pipeline += '| ';

    const visState = JSON.parse(this.visInput?.visualizationState ?? '{}');
    const params = visState.params ?? {};

    if (visState.type === 'vega-lite' || visState.type === 'vega') {
      if (params.spec) {
        pipeline += `vega spec='${escapeString(JSON.stringify(params.spec))}'`;
      } else {
        return '';
      }
    }

    return pipeline;
  };

  private handleChange() {
    let dirty = false;

    // Check if timerange has changed
    if (!isEqual(this.input.timeRange, this.timeRange)) {
      this.timeRange = cloneDeep(this.input.timeRange);
      dirty = true;
    }

    if (this.handler && dirty) {
      this.updateHandler();
    }
  }

  private updateHandler = async () => {
    const expressionParams: IExpressionLoaderParams = {
      searchContext: {
        timeRange: this.timeRange,
        // for PPL+vega, we don't read query and fitlers from input, because these are already defined by ppl
        // query: this.input.query,
        // filters: this.input.filters,
      },
      uiState: this.uiState,
    };
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const abortController = this.abortController;

    const expression = await this.buildPipeline();

    if (this.handler && !abortController.signal.aborted) {
      this.handler.update(expression, expressionParams);
    }
  };

  onContainerError = (error: ExpressionRenderError) => {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.renderComplete.dispatchError();
    this.updateOutput({ loading: false, error });
  };

  onContainerLoading = () => {
    this.renderComplete.dispatchInProgress();
    this.updateOutput({ loading: true, error: undefined });
  };

  onContainerRender = () => {
    this.renderComplete.dispatchComplete();
    this.updateOutput({ loading: false, error: undefined });
  };

  // TODO: fix inspector
  public getInspectorAdapters = () => {
    if (!this.handler) {
      return undefined;
    }
    return this.handler.inspect();
  };

  public async render(domNode: HTMLElement) {
    this.timeRange = cloneDeep(this.input.timeRange);

    const div = document.createElement('div');
    div.className = `visualize panel-content panel-content--fullWidth`;
    domNode.appendChild(div);
    domNode.classList.add('text2viz-canvas');

    this.domNode = div;
    super.render(this.domNode);

    const expressions = getExpressions();
    this.handler = new expressions.ExpressionLoader(this.domNode, undefined, {
      onRenderError: (element: HTMLElement, error: ExpressionRenderError) => {
        this.onContainerError(error);
      },
    });

    if (this.handler) {
      this.subscriptions.push(this.handler.loading$.subscribe(this.onContainerLoading));
      this.subscriptions.push(this.handler.render$.subscribe(this.onContainerRender));
    }

    this.updateHandler();
  }

  public updateInput(changes: Partial<NLQVisualizationInput>): void {
    super.updateInput(changes);
    this.visInput = changes.visInput;
    this.reload();
  }

  public reload = () => {
    this.updateHandler();
  };

  public destroy() {
    super.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());

    if (this.handler) {
      this.handler.destroy();
      this.handler.getElement().remove();
    }
  }
}
