/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable, Subscriber } from 'rxjs';

export const convertEventStreamToObservable = (
  stream: ReadableStream
): {
  output$: Observable<string>;
  cancel: () => void;
} => {
  const reader = stream.getReader();
  let observerOutside: Subscriber<string> | null;
  const output$ = new Observable<string>((observer) => {
    observerOutside = observer;
    const decoder = new TextDecoder();

    async function processNextChunk() {
      try {
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
      observerOutside?.complete();
    },
  };
};
