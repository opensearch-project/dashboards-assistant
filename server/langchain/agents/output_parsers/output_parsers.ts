/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatConversationalAgentOutputParser } from 'langchain/agents';

// Temporary workaround for LLM giving invalid JSON with '\n' in values
export class ChatConversationalAgentOutputLenientParser extends ChatConversationalAgentOutputParser {
  async parse(text: string) {
    return super.parse(text).catch(() => {
      const json = super.parse(text.replace(/\n/g, ' '.repeat(15)));
      return JSON.parse(JSON.stringify(json).replace(/\S {15}\S/g, '\\n'));
    });
  }
}
