/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatConversationalAgentOutputLenientParser } from '../output_parsers';

describe('OutputParsers', () => {
  const toolNames = ['tool 1', 'tool 2'];

  it('parses correct output', async () => {
    const parser = new ChatConversationalAgentOutputLenientParser({ toolNames });
    const output = await parser.parse(
      ' ```json\n{\n    "action": "Query OpenSearch", \n    "action_input": "GET /_search\\n{\\n    \\"query\\": {\\n        \\"range\\": {\\n            \\"timestamp\\": {\\n                \\"gte\\": \\"now-3d/d\\", \\n                \\"lte\\": \\"now/d\\"\\n            }\\n        }\\n    },\\n    \\"aggs\\": {\\n        \\"flights_per_hour\\": {\\n            \\"date_histogram\\": {\\n                \\"field\\": \\"timestamp\\", \\n                \\"interval\\": \\"hour\\"\\n            }\\n        }\\n    }\\n}"\n}\n```'
    );
    expect(output).toMatchObject({
      tool: 'Query OpenSearch',
      toolInput:
        'GET /_search\n{\n    "query": {\n        "range": {\n            "timestamp": {\n                "gte": "now-3d/d", \n                "lte": "now/d"\n            }\n        }\n    },\n    "aggs": {\n        "flights_per_hour": {\n            "date_histogram": {\n                "field": "timestamp", \n                "interval": "hour"\n            }\n        }\n    }\n}',
    });
  });

  it('parses tool input with new lines', async () => {
    const parser = new ChatConversationalAgentOutputLenientParser({ toolNames });
    const output = await parser.parse(
      ' ```\n{\n    "action": "Query OpenSearch",\n    "action_input": "source=accounts\n| where age = 39" \n}\n```'
    );
    expect(output).toMatchObject({
      tool: 'Query OpenSearch',
      toolInput: 'source=accounts\n| where age = 39',
    });
  });

  it('parses final answer with new lines', async () => {
    const parser = new ChatConversationalAgentOutputLenientParser({ toolNames });
    const output = await parser.parse(
      ' ```json\n{\n    "action": "Final Answer",\n    "action_input": "There were 0 flights in the past 3 days\naccording to the query results." \n}\n```'
    );
    expect(output).toMatchObject({
      returnValues: {
        output: 'There were 0 flights in the past 3 days\naccording to the query results.',
      },
    });
  });

  it('parses output with double backslashes', async () => {
    const parser = new ChatConversationalAgentOutputLenientParser({ toolNames });
    const output = await parser.parse(
      ' ```json\n{\\n    \\"action\\": \\"Final Answer\\",\\n    \\"action_input\\": \\"There was an error parsing the JSON response from the query tool. Here are some suggestions based on the error message: \\n\\n• Double check that the JSON response is properly formatted with correct syntax. \\n• Ensure the JSON response is wrapped in double quotes. \\n• Check that the JSON keys and strings are properly quoted. \\n• Confirm there are no trailing commas after the last JSON object or array element.\\"\\n}\\n```'
    );
    expect(output).toMatchObject({
      returnValues: {
        output:
          'There was an error parsing the JSON response from the query tool. Here are some suggestions based on the error message:\n\n • Double check that the JSON response is properly formatted with correct syntax.\n • Ensure the JSON response is wrapped in double quotes.\n • Check that the JSON keys and strings are properly quoted.\n • Confirm there are no trailing commas after the last JSON object or array element.',
      },
    });
  });

  it('parses output with unmatched quotes', async () => {
    const parser = new ChatConversationalAgentOutputLenientParser({ toolNames });
    const output = await parser.parse(
      ' ```json\n{\\n    \\"action\\": \\"Final Answer\\",\\n    \\"action_input\\": \\"There are 16 indices in your cluster according to the information provided. The indices include:\\n\\n- .plugins-ml-model-group \\n- .kibana_92668751_admin_1\\n- .chat-assistant-config\\n- .plugins-ml-task\\n- .plugins-ml-connector\\n- .opendistro_security\\n- .kibana_1\\n- .llm-traces\\n- .plugins-ml-config\\n- .opensearch-observability\\n- .plugins-ml-model\\n- opensearch_dashboards_sample_data_logs\\n- opensearch_dashboards_sample_data_flights\\n- security-auditlog-2023.09.27\\n- security-auditlog-2023.09.28\\n- opensearch_dashboards_sample_data_ecommerce\\n\\n```\\n}\\n```'
    );
    expect(output).toMatchObject({
      returnValues: {
        output:
          'There are 16 indices in your cluster according to the information provided. The indices include:\n\n- .plugins-ml-model-group\n - .kibana_92668751_admin_1\n- .chat-assistant-config\n- .plugins-ml-task\n- .plugins-ml-connector\n- .opendistro_security\n- .kibana_1\n- .llm-traces\n- .plugins-ml-config\n- .opensearch-observability\n- .plugins-ml-model\n- opensearch_dashboards_sample_data_logs\n- opensearch_dashboards_sample_data_flights\n- security-auditlog-2023.09.27\n- security-auditlog-2023.09.28\n- opensearch_dashboards_sample_data_ecommerce\n\n',
      },
    });
  });

  it('throws exception if no JSON found', () => {
    const parser = new ChatConversationalAgentOutputLenientParser({ toolNames });
    expect(parser.parse('Internal Error')).rejects.toThrowError();
  });
});
