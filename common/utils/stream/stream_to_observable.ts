/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';

export const convertEventStreamToObservable = (
  stream: ReadableStream,
  abortController: AbortController
): {
  output$: Observable<string>;
  cancel: () => void;
} => {
  const reader = stream.getReader();
  const output$ = new Observable<string>((observer) => {
    const decoder = new TextDecoder();

    async function processNextChunk() {
      try {
        if (abortController.signal.aborted) {
          // If the abort controller is aborted.
          // stop reading the stream.
          reader.cancel();
          return;
        }
        const { done, value } = await reader.read();

        if (done) {
          observer.complete();
          return;
        }

        const chunk = decoder.decode(value);

        observer.next(chunk);

        processNextChunk();
      } catch (error) {
        observer.error(error);
      }
    }

    processNextChunk();
  });

  return {
    output$,
    cancel: () => {
      reader.cancel();
    },
  };
};
