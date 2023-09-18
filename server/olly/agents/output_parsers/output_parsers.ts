/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */

import { ChatConversationalAgentOutputParser } from 'langchain/agents';

class OutputParserException extends Error {
  output?: string;

  constructor(message: string, output?: string) {
    super(message);
    this.output = output;
  }
}

// Temporary workaround for LLM giving invalid JSON with '\n' in values
export class ChatConversationalAgentOutputLenientParser extends ChatConversationalAgentOutputParser {
  async parse(text: string) {
    return super
      .parse(text)
      .catch(() => {
        let jsonOutput = text.trim().replace(/\n/g, ' '.repeat(15));
        if (jsonOutput.includes('```json')) {
          jsonOutput = jsonOutput.split('```json')[1].trimStart();
        } else if (jsonOutput.includes('```')) {
          const firstIndex = jsonOutput.indexOf('```');
          jsonOutput = jsonOutput.slice(firstIndex + 3).trimStart();
        }
        const lastIndex = jsonOutput.lastIndexOf('```');
        if (lastIndex !== -1) {
          jsonOutput = jsonOutput.slice(0, lastIndex).trimEnd();
        }

        const response = JSON.parse(
          JSON.stringify(JSON.parse(jsonOutput)).replace(/( {15})/g, '\\n')
        );

        const { action, action_input: actionInput } = response;

        if (action === 'Final Answer') {
          return { returnValues: { output: actionInput }, log: text };
        }
        return { tool: action, toolInput: actionInput, log: text };
      })
      .catch((e) => {
        throw new OutputParserException(`Failed to parse. Text: "${text}". Error: ${e}`);
      });
  }
}
