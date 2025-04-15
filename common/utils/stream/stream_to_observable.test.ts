/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReadableStream as NodeReadableStream } from 'stream/web';
import { convertEventStreamToObservable } from './stream_to_observable';
import { waitFor } from '@testing-library/dom';

describe('convertEventStreamToObservable', () => {
  it('should generate observable successfully', async () => {
    const { output$ } = convertEventStreamToObservable(
      new NodeReadableStream({
        start: (controller) => {
          controller.enqueue(new TextEncoder().encode('test'));
        },
      }) as ReadableStream
    );
    const mockedCallback = jest.fn();
    output$.subscribe(mockedCallback);
    await waitFor(() => {
      expect(mockedCallback).toBeCalledWith('test');
    });
  });

  it('should stop reader once cancel being called', async () => {
    const { output$, cancel } = convertEventStreamToObservable(
      new NodeReadableStream({
        start: async (controller) => {
          controller.enqueue(new TextEncoder().encode('test'));
          await new Promise((resolve) => setTimeout(resolve, 1000));
          controller.enqueue(new TextEncoder().encode('test'));
        },
      }) as ReadableStream
    );
    const mockedCallback = jest.fn();
    const mockedCompleteCallback = jest.fn();
    output$.subscribe({
      next: mockedCallback,
      complete: mockedCompleteCallback,
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    cancel();
    await waitFor(() => {
      expect(mockedCallback).toBeCalledTimes(1);
      expect(mockedCompleteCallback).toBeCalledTimes(1);
    });
  });
});
