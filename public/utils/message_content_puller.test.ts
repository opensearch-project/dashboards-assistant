/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { MessageContentPuller } from './message_content_puller';

describe('MessageContentPool', () => {
  it('should output with buffered content', async () => {
    const messageContentPool = new MessageContentPuller({
      contentSliceLength: 10,
    });
    const subscriptionMock = jest.fn();
    const completeSubscriptionMock = jest.fn();
    messageContentPool.addMessageContent('a', 'a'.repeat(20));
    messageContentPool.addMessageContent('b', 'b'.repeat(10));
    const output$ = messageContentPool.getOutput$();
    output$.subscribe({
      next: subscriptionMock,
      complete: completeSubscriptionMock,
    });
    messageContentPool.start();
    messageContentPool.inputComplete();

    await waitFor(
      () => {
        expect(subscriptionMock).toHaveBeenCalledTimes(3);
        expect(subscriptionMock).toHaveBeenNthCalledWith(1, {
          messageContent: 'a'.repeat(10),
          messageId: 'a',
        });
        expect(subscriptionMock).toHaveBeenNthCalledWith(2, {
          messageContent: 'b'.repeat(10),
          messageId: 'b',
        });
        expect(subscriptionMock).toHaveBeenNthCalledWith(3, {
          messageContent: 'a'.repeat(10),
          messageId: 'a',
        });
        expect(completeSubscriptionMock).toHaveBeenCalledTimes(1);
      },
      {
        timeout: 10000,
      }
    );
  });

  it('should buffer content when isContentReadyToUse returns false', async () => {
    const messageContentPool = new MessageContentPuller({
      maxBufferLength: 50,
      isContentReadyToUse: (message: string) => {
        if (message.endsWith(')')) {
          return true;
        }

        return false;
      },
    });
    const subscriptionMock = jest.fn();
    const completeSubscriptionMock = jest.fn();
    messageContentPool.addMessageContent('a', `a[hyperlink`);
    messageContentPool.addMessageContent('a', `](href`);
    messageContentPool.addMessageContent('a', `)`);

    // should emit content when the length exceeds 50
    messageContentPool.addMessageContent('b', `[link whose length is larger than 50]`);
    messageContentPool.addMessageContent('b', `(${'a'.repeat(51)})`);
    const output$ = messageContentPool.getOutput$();
    output$.subscribe({
      next: subscriptionMock,
      complete: completeSubscriptionMock,
    });
    messageContentPool.start();
    messageContentPool.inputComplete();

    await waitFor(
      () => {
        expect(subscriptionMock).toHaveBeenCalledTimes(3);
        expect(subscriptionMock).toBeCalledWith({
          messageContent: 'a[hyperlink](href)',
          messageId: 'a',
        });

        expect(subscriptionMock).toBeCalledWith({
          messageContent: `[link whose length is larger than 50](${'a'.repeat(22)}`,
          messageId: 'b',
        });
        expect(subscriptionMock).toBeCalledWith({
          messageContent: `${'a'.repeat(29)})`,
          messageId: 'b',
        });
        expect(completeSubscriptionMock).toHaveBeenCalledTimes(1);
      },
      {
        timeout: 10000,
      }
    );
  });
});
