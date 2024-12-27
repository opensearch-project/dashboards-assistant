/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

import { Task } from './task';

export class Pipeline {
  input$ = new Subject<any>();
  output$: Observable<any>;
  status$ = new BehaviorSubject<'RUNNING' | 'STOPPED'>('STOPPED');

  constructor(private readonly tasks: Array<Task<any, any>>) {
    this.output$ = this.input$
      .pipe(tap(() => this.status$.next('RUNNING')))
      .pipe(
        switchMap((value) => {
          return this.tasks
            .reduce((acc$, task) => {
              return acc$.pipe(switchMap((result) => task.execute(result)));
            }, of(value))
            .pipe(catchError((e) => of({ error: e })));
        })
      )
      .pipe(tap(() => this.status$.next('STOPPED')));
  }

  /**
   * Triggers the pipeline execution by emitting a new input value.
   * This will start the processing of the provided input value through the pipeline's tasks,
   * with each task transforming the input in sequence. The resulting value will be emitted
   * through the `output$` observable.
   */
  run(input: any) {
    this.input$.next(input);
  }

  /**
   * Synchronously processes the provided input value through the pipeline's tasks in sequence.
   * This method bypasses the reactive pipeline and executes each task one by one,
   * it suitable for use cases where you need a one-time, imperative-style execution.
   */
  async runOnce(input: any) {
    let nextInput = input;
    for (const task of this.tasks) {
      nextInput = await task.execute(nextInput);
    }
    return nextInput;
  }

  getResult$() {
    return this.output$;
  }
}
