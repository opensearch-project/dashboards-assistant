/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */

import { ChatConversationalAgentOutputParserWithRetries } from 'langchain/agents';

class OutputParserException extends Error {
  output?: string;

  constructor(message: string, output?: string) {
    super(message);
    this.output = output;
  }
}

// Temporary workaround for LLM giving invalid JSON with '\n' in values
export class ChatConversationalAgentOutputLenientParser extends ChatConversationalAgentOutputParserWithRetries {
  private getInnerJSONString(jsonOutput: string) {
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
    return jsonOutput;
  }

  private createAgentResponse(response: { action: string; action_input: string }, text: string) {
    if (response.action === 'Final Answer') {
      return { returnValues: { output: response.action_input }, log: text };
    }
    return { tool: response.action, toolInput: response.action_input, log: text };
  }

  async parse(text: string) {
    return super
      .parse(text)
      .catch(() => {
        const jsonOutput = text.trim().replace(/\n/g, ' '.repeat(15));
        const jsonStr = this.getInnerJSONString(jsonOutput);
        const response = JSON.parse(JSON.stringify(JSON.parse(jsonStr)).replace(/( {15})/g, '\\n'));
        return this.createAgentResponse(response, text);
      })
      .catch(() => {
        const jsonOutput = text
          .trim()
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\n/g, ' '.repeat(15))
          .replace(/```\s*}\s*```\s*/g, '"}```');
        const jsonStr = this.getInnerJSONString(jsonOutput);
        const response = JSON.parse(JSON.stringify(JSON.parse(jsonStr)).replace(/( {15})/g, '\\n'));
        return this.createAgentResponse(response, text);
      })
      .catch((e) => {
        throw new OutputParserException(`Failed to parse. Text: "${text}". Error: ${e}`);
      });
  }
}
