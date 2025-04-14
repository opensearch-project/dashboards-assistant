/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { MessageContentPuller } from './message_content_puller';

describe('MessageContentPool', () => {
  it('should output with buffered content', async () => {
    const messageContentPool = new MessageContentPuller();
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

    await waitFor(() => {
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
    });
  });
});
