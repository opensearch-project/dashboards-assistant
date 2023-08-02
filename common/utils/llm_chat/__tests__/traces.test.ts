/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { convertToTraces } from '../traces';

describe('Test', () => {
  it('should return true', () => {
    const traces = convertToTraces(mockRuns);
    expect(traces).toEqual([
      {
        id: '2f65e78d-3a5a-4099-b117-6ef44674d1d7',
        input: 'human input',
        name: 'agent_executor',
        output: 'ai output',
        startTime: 1690999999307,
        type: 'chain',
      },
      {
        id: 'e9ebaeeb-4940-4cc0-ab6b-0c567f0bc855',
        input: '',
        name: 'llm_chain',
        output:
          ' Here is my output in the requested JSON format:\n\n```json\n{\n  "question1": "What is the health status of the indices?",\n  "question2": "What are the names of the indices?" \n}\n```',
        startTime: 1691000010394,
        type: 'chain',
      },
      {
        id: '8033e5dd-e361-4b58-816a-11bd1881ebc4',
        input: '',
        name: 'Get OpenSearch indices',
        output:
          'row_number,health,status,index,uuid,pri,rep,docs.count,docs.deleted,store.size,pri.store.size\n1,green,open,.ql-datasources,AGgmrf6hQeCX2g9EB9nV_A,1,0,0,0,208b,208b\n2,green,open,.kibana_3599307_user_1,24-GlOqpTXuquTafnfCPdQ,1,0,1,0,5.2kb,5.2kb',
        startTime: 1691000001634,
        type: 'tool',
      },
      {
        id: '6cc3b18f-2725-4194-8cd9-e602b93fa53e',
        input: 'suggestions input',
        name: 'anthropic',
        output:
          ' Here is my output in the requested JSON format:\n\n```json\n{\n  "question1": "What is the health status of the indices?",\n  "question2": "What are the names of the indices?" \n}\n```',
        startTime: 1691000010394,
        type: 'llm',
      },
    ]);
  });
});

const mockRuns: Run[] = [
  {
    id: '2f65e78d-3a5a-4099-b117-6ef44674d1d7',
    name: 'agent_executor',
    start_time: 1690999999307,
    serialized: { name: 'agent_executor' },
    inputs: {
      input: 'human input',
      chat_history: [
        { type: 'human', data: { content: 'human input' } },
        { type: 'ai', data: { content: 'ai output' } },
      ],
    },
    execution_order: 1,
    child_execution_order: 2,
    run_type: 'chain',
    child_runs: [
      {
        id: '8033e5dd-e361-4b58-816a-11bd1881ebc4',
        name: 'Get OpenSearch indices',
        parent_run_id: '2f65e78d-3a5a-4099-b117-6ef44674d1d7',
        start_time: 1691000001634,
        serialized: { name: 'Get OpenSearch indices' },
        inputs: {},
        execution_order: 2,
        child_execution_order: 2,
        run_type: 'tool',
        child_runs: [],
        end_time: 1691000001646,
        outputs: {
          output:
            'row_number,health,status,index,uuid,pri,rep,docs.count,docs.deleted,store.size,pri.store.size\n1,green,open,.ql-datasources,AGgmrf6hQeCX2g9EB9nV_A,1,0,0,0,208b,208b\n2,green,open,.kibana_3599307_user_1,24-GlOqpTXuquTafnfCPdQ,1,0,1,0,5.2kb,5.2kb',
        },
      },
    ],
    end_time: 1691000010381,
    outputs: { output: 'ai output' },
  },
  {
    id: 'e9ebaeeb-4940-4cc0-ab6b-0c567f0bc855',
    name: 'llm_chain',
    start_time: 1691000010394,
    serialized: { name: 'llm_chain' },
    inputs: {
      tools_description: 'tools descriptions',
      chat_history: 'human: human input\nai: ai output',
    },
    execution_order: 1,
    child_execution_order: 2,
    run_type: 'chain',
    child_runs: [
      {
        id: '6cc3b18f-2725-4194-8cd9-e602b93fa53e',
        name: 'anthropic',
        parent_run_id: 'e9ebaeeb-4940-4cc0-ab6b-0c567f0bc855',
        start_time: 1691000010394,
        serialized: { name: 'anthropic' },
        inputs: { messages: [[{ type: 'human', data: { content: 'suggestions input' } }]] },
        execution_order: 2,
        child_runs: [],
        child_execution_order: 2,
        run_type: 'llm',
        extra: {
          invocation_params: {
            model: 'claude-v1',
            temperature: 1e-7,
            top_k: -1,
            top_p: -1,
            stop_sequences: ['\n\nHuman:'],
            max_tokens_to_sample: 2048,
            stream: false,
          },
        },
        end_time: 1691000013941,
        outputs: {
          generations: [
            [
              {
                text:
                  ' Here is my output in the requested JSON format:\n\n```json\n{\n  "question1": "What is the health status of the indices?",\n  "question2": "What are the names of the indices?" \n}\n```',
                message: {
                  type: 'ai',
                  data: {
                    content:
                      ' Here is my output in the requested JSON format:\n\n```json\n{\n  "question1": "What is the health status of the indices?",\n  "question2": "What are the names of the indices?" \n}\n```',
                  },
                },
              },
            ],
          ],
        },
      },
    ],
    end_time: 1691000013941,
    outputs: {
      text:
        ' Here is my output in the requested JSON format:\n\n```json\n{\n  "question1": "What is the health status of the indices?",\n  "question2": "What are the names of the indices?" \n}\n```',
    },
  },
];
