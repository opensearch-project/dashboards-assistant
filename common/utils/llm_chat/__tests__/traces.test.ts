/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { convertToTraces } from '../traces';
import { AgentRun } from 'langchain/dist/callbacks/handlers/tracer';

describe('Test', () => {
  it('should convert runs to traces', () => {
    const traces = convertToTraces(mockRuns);
    expect(traces).toEqual([
      {
        actions: [
          {
            log: ' ```json\n{\n    "action": "Get OpenSearch indices" \n}\n```',
            tool: 'Get OpenSearch indices',
            toolInput: '',
          },
        ],
        id: 'bbc4791c-601b-4c7c-ba62-409419e8ef41',
        input: 'human input',
        name: 'AgentExecutor',
        output: 'ai output',
        parentRunId: undefined,
        startTime: 1692820695308,
        type: 'chain',
      },
      {
        id: '3d7145a2-1cc1-43cb-9685-bfbe426f03d0',
        input: '',
        name: 'LLMChain',
        output: 'suggestions',
        parentRunId: undefined,
        startTime: 1692820706240,
        type: 'chain',
      },
      {
        id: 'ad3d36d6-ecba-4ca1-a14a-9fd54132d16b',
        input: '',
        name: 'Get OpenSearch indices',
        output: 'tools output',
        parentRunId: 'bbc4791c-601b-4c7c-ba62-409419e8ef41',
        startTime: 1692820697545,
        type: 'tool',
      },
      {
        id: '9c610e59-8abb-4f56-a9c8-5e0cb980ba15',
        input: 'human message',
        name: 'ChatAnthropic',
        output: 'suggestions',
        parentRunId: '3d7145a2-1cc1-43cb-9685-bfbe426f03d0',
        startTime: 1692820706241,
        type: 'llm',
      },
    ]);
  });
});

const mockRuns: Array<AgentRun | Run> = [
  {
    id: 'bbc4791c-601b-4c7c-ba62-409419e8ef41',
    name: 'AgentExecutor',
    start_time: 1692820695308,
    serialized: {
      lc: 1,
      type: 'not_implemented',
      id: ['langchain', 'agents', 'executor', 'AgentExecutor'],
    },
    events: [
      { name: 'start', time: 1692820695308 },
      {
        name: 'agent_action',
        time: 1692820697543,
        kwargs: {
          action: {
            tool: 'Get OpenSearch indices',
            log: ' ```json\n{\n    "action": "Get OpenSearch indices" \n}\n```',
          },
        },
      },
      {
        name: 'agent_end',
        time: 1692820706226,
        kwargs: {
          action: {
            returnValues: { output: 'ai output' },
            log:
              ' ```json\n{\n    "action": "Final Answer", \n    "action_input": "ai output" \n}\n```',
          },
        },
      },
      { name: 'end', time: 1692820706226 },
    ],
    inputs: {
      input: 'human input',
      chat_history: [
        {
          lc: 1,
          type: 'constructor',
          id: ['langchain', 'schema', 'HumanMessage'],
          kwargs: { content: 'human input', additional_kwargs: {} },
        },
        {
          lc: 1,
          type: 'constructor',
          id: ['langchain', 'schema', 'AIMessage'],
          kwargs: { content: 'ai output', additional_kwargs: {} },
        },
      ],
    },
    execution_order: 1,
    child_execution_order: 2,
    run_type: 'chain',
    child_runs: [
      {
        id: 'ad3d36d6-ecba-4ca1-a14a-9fd54132d16b',
        name: 'DynamicTool',
        parent_run_id: 'bbc4791c-601b-4c7c-ba62-409419e8ef41',
        start_time: 1692820697545,
        serialized: { lc: 1, type: 'not_implemented', id: ['langchain', 'tools', 'DynamicTool'] },
        events: [
          { name: 'start', time: 1692820697545 },
          { name: 'end', time: 1692820697560 },
        ],
        inputs: {},
        execution_order: 2,
        child_execution_order: 2,
        run_type: 'tool',
        child_runs: [],
        extra: { metadata: {} },
        tags: [],
        end_time: 1692820697560,
        outputs: { output: 'tools output' },
      },
    ],
    extra: { metadata: {} },
    tags: [],
    actions: [
      {
        tool: 'Get OpenSearch indices',
        log: ' ```json\n{\n    "action": "Get OpenSearch indices" \n}\n```',
        toolInput: '',
      },
    ],
    end_time: 1692820706226,
    outputs: { output: 'ai output' },
  },
  {
    id: '3d7145a2-1cc1-43cb-9685-bfbe426f03d0',
    name: 'LLMChain',
    start_time: 1692820706240,
    serialized: {
      lc: 1,
      type: 'constructor',
      id: ['langchain', 'chains', 'llm', 'LLMChain'],
      kwargs: {
        llm: {
          lc: 1,
          type: 'constructor',
          id: ['langchain', 'chat_models', 'anthropic', 'ChatAnthropic'],
          kwargs: {
            temperature: 1e-7,
            anthropic_api_key: { lc: 1, type: 'secret', id: ['ANTHROPIC_API_KEY'] },
          },
        },
        prompt: {
          lc: 1,
          type: 'constructor',
          id: ['langchain', 'prompts', 'prompt', 'PromptTemplate'],
          kwargs: { template: 'prompt', input_variables: ['tools_description', 'chat_history'] },
        },
      },
    },
    events: [
      { name: 'start', time: 1692820706240 },
      { name: 'end', time: 1692820709238 },
    ],
    inputs: {
      tools_description: 'tools description',
      chat_history: 'human: human input\nai: ai output',
    },
    execution_order: 1,
    child_execution_order: 2,
    run_type: 'chain',
    child_runs: [
      {
        id: '9c610e59-8abb-4f56-a9c8-5e0cb980ba15',
        name: 'ChatAnthropic',
        parent_run_id: '3d7145a2-1cc1-43cb-9685-bfbe426f03d0',
        start_time: 1692820706241,
        serialized: {
          lc: 1,
          type: 'constructor',
          id: ['langchain', 'chat_models', 'anthropic', 'ChatAnthropic'],
          kwargs: {
            temperature: 1e-7,
            anthropic_api_key: { lc: 1, type: 'secret', id: ['ANTHROPIC_API_KEY'] },
          },
        },
        events: [
          { name: 'start', time: 1692820706241 },
          { name: 'end', time: 1692820709238 },
        ],
        inputs: {
          messages: [
            [
              {
                lc: 1,
                type: 'constructor',
                id: ['langchain', 'schema', 'HumanMessage'],
                kwargs: { content: 'human message', additional_kwargs: {} },
              },
            ],
          ],
        },
        execution_order: 2,
        child_runs: [],
        child_execution_order: 2,
        run_type: 'llm',
        extra: {
          options: {},
          invocation_params: {
            model: 'claude-v1',
            temperature: 1e-7,
            top_k: -1,
            top_p: -1,
            stop_sequences: ['\n\nHuman:'],
            max_tokens_to_sample: 2048,
            stream: false,
          },
          metadata: {},
        },
        tags: [],
        end_time: 1692820709238,
        outputs: {
          generations: [
            [
              {
                text: 'suggestions',
                message: {
                  lc: 1,
                  type: 'constructor',
                  id: ['langchain', 'schema', 'AIMessage'],
                  kwargs: { content: 'suggestions', additional_kwargs: {} },
                },
              },
            ],
          ],
        },
      },
    ],
    extra: { metadata: {} },
    tags: [],
    end_time: 1692820709238,
    outputs: { text: 'suggestions' },
  },
];
