/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Reducer } from 'react';

interface State<T> {
  data?: T;
  loading: boolean;
  error?: Error;
}

type Action<T> =
  | { type: 'request' }
  | { type: 'success'; payload: State<T>['data'] }
  | {
      type: 'failure';
      error: NonNullable<State<T>['error']> | { body: NonNullable<State<T>['error']> };
    };

// TODO use instantiation expressions when typescript is upgraded to >= 4.7
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericReducer<T = any> = Reducer<State<T>, Action<T>>;
export const genericReducer: GenericReducer = (state, action) => {
  switch (action.type) {
    case 'request':
      return { data: state.data, loading: true };
    case 'success':
      return { loading: false, data: action.payload };
    case 'failure':
      return { loading: false, error: 'body' in action.error ? action.error.body : action.error };
    default:
      return state;
  }
};

interface StateWithAbortController<T> {
  data?: T;
  loading: boolean;
  error?: Error;
  abortController?: AbortController;
}

type ActionWithAbortController<T> =
  | { type: 'request'; abortController: AbortController }
  | { type: 'success'; payload: State<T>['data'] }
  | {
      type: 'failure';
      error: NonNullable<State<T>['error']> | { body: NonNullable<State<T>['error']> };
    };

// TODO use instantiation expressions when typescript is upgraded to >= 4.7
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericReducerWithAbortController<T = any> = Reducer<
  StateWithAbortController<T>,
  ActionWithAbortController<T>
>;
export const genericReducerWithAbortController: GenericReducerWithAbortController = (
  state,
  action
) => {
  switch (action.type) {
    case 'request':
      return { data: state.data, loading: true, abortController: action.abortController };
    case 'success':
      return { loading: false, data: action.payload };
    case 'failure':
      return { loading: false, error: 'body' in action.error ? action.error.body : action.error };
    default:
      return state;
  }
};
