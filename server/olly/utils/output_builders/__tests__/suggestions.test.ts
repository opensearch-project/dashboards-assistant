/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildSuggestions } from '../suggestions';
import { createMessage } from '../../../__tests__/__utils__/test_helpers';

describe('build suggestions', () => {
  it('builds suggestion outputs', () => {
    const outputs = buildSuggestions(
      { question1: 'test suggestion 1', question2: 'test suggestion 2' },
      [createMessage()]
    );
    expect(outputs[0].suggestedActions).toEqual([
      { actionType: 'send_as_input', message: 'test suggestion 1' },
      { actionType: 'send_as_input', message: 'test suggestion 2' },
    ]);
  });

  it('builds empty suggestion outputs', () => {
    const outputs = buildSuggestions({ ignored: 'test suggestion 1' }, [createMessage()]);
    expect(outputs[0].suggestedActions).toEqual([]);
  });
});
