## Getting started guide

### How to run assistant on your 2.12+ OpenSearch cluster
Below are the set of steps to run OpenSearch and OpenSearch dashboards with the OpenSearch assistant and the query generation functionality in the Observability Log Explorer page correctly on the cluster.

1. Setup a 2.12+ OpenSearch cluster with OpenSearch Dashboards by following the options here: https://opensearch.org/docs/latest/install-and-configure/
   1. Note: If you are using a min distribution, there are required OpenSearch and OpenSearch Dashboards plugin to run the assistant.
      1. Required OpenSearch plugins: ML-Commons, Flow Framework, Skill, SQL, and Observability
      2. Required OpenSearch Dashboard plugins: Dashboard Assistant, Dashboard Observability
2. Enable the following settings to enable the features:
   1. To enable the chat assistant feature, set `assistant.chat.enabled` to `true` and `assistant.chat.rootAgentName` to `"Root agent"` in the `opensearch_dashboards.yml` file.
   2. To enable the chat assistant feature, set `observability.query_assist.enabled` to `true` and `observability.query_assist.ppl_agent_name` to `"PPL agent"` in the `opensearch_dashboards.yml` file.
3. After OpenSearch and OpenSearch Dashboards are running, we will setup ML Commons to connect to the LLM model
4. Run ML commons on Data node
   ```
   PUT _cluster/settings
   {
     "persistent" : {
     "plugins.ml_commons.only_run_on_ml_node":"false"
     }
   }
     ```
5. Add Trusted Endpoints ([reference doc](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/index/))
   ```
   PUT _cluster/settings
   {
     "persistent" : {
       "plugins.ml_commons.trusted_connector_endpoints_regex":
       [ "^https://runtime\\.sagemaker\\..*[a-z0-9-]\\.amazonaws\\.com/.*$",
         "^https://api\\.openai\\.com/.*$",
         "^https://api\\.cohere\\.ai/.*$",
         "^https://bedrock-runtime\\.us-east-1\\.amazonaws\\.com/.*$"
       ]
     }
   }
   ```
6. Call the flow framework plugin with this template to setup the cluster for the assistant. 
   1. Note that this template uses the AWS Bedrock service with the Claude model. Other models from other services can be used instead.
   2. Note that if using the Bedrock model, IAM credentials need to be passed into the template to connect to Bedrock.
  ```
  POST /_plugins/_flow_framework/workflow?provision=true
  {
    "name": "tool-register-agent",
    "description": "Flow template",
    "use_case": "REGISTER_AGENT",
    "version": {
      "template": "1.0.0",
      "compatibility": [
        "2.12.0",
        "3.0.0"
      ]
    },
    "workflows": {
      "provision": {
        "user_params": {},
        "nodes": [
          {
            "id": "create_connector_1",
            "type": "create_connector",
            "previous_node_inputs": {},
            "user_inputs": {
              "version": "1",
              "name": "Claude instant runtime Connector",
              "protocol": "aws_sigv4",
              "description": "The connector to BedRock service for claude model",
              "actions": [
                {
                  "headers": {
                    "x-amz-content-sha256": "required",
                    "content-type": "application/json"
                  },
                  "method": "POST",
                  "request_body": "{\"prompt\":\"${parameters.prompt}\", \"max_tokens_to_sample\":${parameters.max_tokens_to_sample}, \"temperature\":${parameters.temperature},  \"anthropic_version\":\"${parameters.anthropic_version}\" }",
                  "action_type": "predict",
                  "url": "https://bedrock-runtime.us-west-2.amazonaws.com/model/anthropic.claude-instant-v1/invoke"
                }
              ],
              "credential": {
                "access_key": "<IAM access key that has permissions to call the Bedrock service>",
                "secret_key": "<IAM secret key that has permissions to call the Bedrock service>"
              },
              "parameters": {
                "endpoint": "bedrock-runtime.us-west-2.amazonaws.com",
                "content_type": "application/json",
                "auth": "Sig_V4",
                "max_tokens_to_sample": "8000",
                "service_name": "bedrock",
                "temperature": "0.0001",
                "response_filter": "$.completion",
                "region": "us-west-2",
                "anthropic_version": "bedrock-2023-05-31"
              }
            }
          },
          {
            "id": "register_model_2",
            "type": "register_remote_model",
            "previous_node_inputs": {
              "create_connector_1": "connector_id"
            },
            "user_inputs": {
              "description": "test model",
              "deploy": true,
              "name": "claude-instant"
            }
          },
          {
            "id": "register_sparse_model_1",
            "type": "register_local_custom_model",
            "user_inputs": {
              "name": "neural-sparse/opensearch-neural-sparse-tokenizer-v1",
              "version": "1.0.0",
              "description": "This is a neural sparse tokenizer model: It tokenize input sentence into tokens and assign pre-defined weight from IDF to each. It serves only in query.",
              "function_name": "SPARSE_TOKENIZE",
              "model_format": "TORCH_SCRIPT",
              "model_content_size_in_bytes": 567691,
              "model_content_hash_value": "b3487da9c58ac90541b720f3b367084f271d280c7f3bdc3e6d9c9a269fb31950",
              "created_time": 1696913667239,
              "model_type": "sparse",
              "embedding_dimension": "1",
              "framework_type": "sentence_transformers",
              "url": "https://artifacts.opensearch.org/models/ml-models/amazon/neural-sparse/opensearch-neural-sparse-tokenizer-v1/1.0.0/torch_script/opensearch-neural-sparse-tokenizer-v1-1.0.0.zip"
            }
          },
          {
            "id": "register_t2ppl_model",
            "type": "register_remote_model",
            "previous_node_inputs": {
              "create_connector_1": "connector_id"
            },
            "user_inputs": {
              "description": "t2ppl fine-tuned model",
              "deploy": true,
              "name": "t2ppl fine-tuned model"
            }
          },
          {
            "id": "deploy_sparse_model_1",
            "type": "deploy_model",
            "previous_node_inputs": {
              "register_sparse_model_1": "model_id"
            }
          },
          {
            "id": "cat_index_tool",
            "type": "create_tool",
            "previous_node_inputs": {},
            "user_inputs": {
              "type": "CatIndexTool",
              "name": "CatIndexTool",
              "description": "Use this tool to get OpenSearch index information: (health, status, index, uuid, primary count, replica count, docs.count, docs.deleted, store.size, primary.store.size).",
              "parameters": {
                "index": ".kibana"
              }
            }
          },
          {
            "id": "visualization_tool",
            "type": "create_tool",
            "previous_node_inputs": {},
            "user_inputs": {
              "description": "Use this tool to find user created visualizations. This tool takes the visualization name as input and returns the first 3 matching visualizations",
              "include_output_in_agent_response": true,
              "type": "VisualizationTool",
              "parameters": {
                "index": ".kibana"
              },
              "name": "VisualizationTool"
            }
          },
          {
            "id": "TransferQuestionToPPLAndExecuteTool",
            "type": "create_tool",
            "previous_node_inputs": {
              "register_t2ppl_model": "model_id"
            },
            "user_inputs": {
              "type": "PPLTool",
              "name": "TransferQuestionToPPLAndExecuteTool",
              "description": "Use this tool to transfer natural language to generate PPL and execute PPL to query inside. Use this tool after you know the index name, otherwise, call IndexRoutingTool first. The input parameters are: 'index' for the index name, and 'question' for UserQuestion.",
              "parameters": {
                "response_filter": "$.completion",
                "prompt": "Below is an instruction that describes a task, paired with the index and corresponding fields that provides further context. Write a response that appropriately completes the request.\n\n### Instruction:\nI have an opensearch index with fields in the following. Now I have a question: ${indexInfo.question} Can you help me generate a PPL for that?\n\n### Index:\n${indexInfo.indexName}\n\n### Fields:\n${indexInfo.mappingInfo}\n\n### Response:\n"
              },
              "include_output_in_agent_response": true
            }
          },
          {
            "id": "search_alerts_tool",
            "type": "create_tool",
            "user_inputs": {
              "type": "SearchAlertsTool",
              "name": "SearchAlertsTool",
              "parameters": {}
            }
          },
          {
            "id": "search_monitors_tool",
            "type": "create_tool",
            "user_inputs": {
              "type": "SearchMonitorsTool",
              "name": "SearchMonitorsTool",
              "parameters": {}
            }
          },
          {
            "id": "search_anomoly_detectors_tool",
            "type": "create_tool",
            "user_inputs": {
              "type": "SearchAnomalyDetectorsTool",
              "name": "SearchAnomalyDetectorsTool",
              "parameters": {}
            }
          },
          {
            "id": "search_anomoly_results_tool",
            "type": "create_tool",
            "user_inputs": {
              "type": "SearchAnomalyResultsTool",
              "name": "SearchAnomalyResultsTool",
              "parameters": {}
            }
          },
          {
            "id": "vector_db_tool",
            "type": "create_tool",
            "user_inputs": {
              "type": "VectorDBTool",
              "name": "VectorDBTool",
              "descriptions": "This is a tool that performs knn-based dense retrieval. It takes 1 argument named input which is a string query for dense retrieval. The tool returns the dense retrieval results for the query.",
              "parameters": {
                "model_id": "ksNnFo0BY4jgIz2mWrHU",
                "index": "my_test_data",
                "embedding_field": "embedding",
                "source_field": "[\"text\"]",
                "input": "${parameters.question}"
              }
            }
          },
          {
            "id": "rag_tool",
            "type": "create_tool",
            "user_inputs": {
              "type": "RAGTool",
              "name": "RAGTool",
              "parameters": {
                "inference_model_id": "${{ register_model_2.model_id }}",
                "embedding_model_id": "ksNnFo0BY4jgIz2mWrHU",
                "index": "my_test_data",
                "embedding_field": "embedding",
                "source_field": "[\"text\"]",
                "input": "${parameters.question}",
                "prompt": "\n\nHuman:\" turn\" You are a professional data analysist. You will always answer question based on the given context first. If the answer is not directly shown in the context, you will analyze the data and find the answer. If you don't know the answer, just say don't know. \n\n Context:\n${parameters.output_field}\n\nHuman:${parameters.input}\n\nAssistant:"
              }
            }
          },
          {
            "id": "neural_sparse_knowledge_base_tool",
            "type": "create_tool",
            "previous_node_inputs": {
              "deploy_sparse_model_1": "model_id"
            },
            "user_inputs": {
              "name": "OpensearchKnowledgeBaseTool",
              "type": "NeuralSparseSearchTool",
              "description": "A tool to search the Opensearch knowledge base, the knowledge base consists of segments of OpenSearch documents. You should always search data with this tool when encountering general questions about Opensearch. But for questions about current concerete cluster, use this tool can not help you. If this tool provides useful info, give the answer and also quote the origin doc. If this tool can not provide knowledge you need, give answer based on your own knowledge. Action Input: <natrual language keywords for question>",
              "parameters": {
                "index": "knowledge_base",
                "embedding_field": "sparse_embedding",
                "source_field": "[\"title\",\"body\"]",
                "doc_size": "10",
                "input": "${parameters.question}"
              }
            }
          },
          {
            "id": "sub_agent",
            "type": "register_agent",
            "previous_node_inputs": {
              "cat_index_tool": "tools",
              "register_model_2": "model_id",
              "visualization_tool": "tools",
              "TransferQuestionToPPLAndExecuteTool": "tools",
              "search_alerts_tool": "tools",
              "search_anomoly_detectors_tool": "tools",
              "search_monitors_tool": "tools",
              "search_anomoly_results_tool": "tools",
              "neural_sparse_knowledge_base_tool": "tools",
              "vector_db_tool": "tools",
              "rag_tool": "tools"
            },
            "user_inputs": {
              "parameters": {},
              "app_type": "chatbot",
              "name": "Sub Agent",
              "description": "this is a test agent",
              "llm.parameters": {
                "max_iteration": "5",
                "stop_when_no_tool_found": "true",
                "response_filter": "$.completion"
              },
              "memory": {
                "type": "conversation_index"
              },
              "type": "conversational"
            }
          },
          {
            "id": "agent_tool",
            "type": "create_tool",
            "previous_node_inputs": {
              "sub_agent": "agent_id"
            },
            "user_inputs": {
              "description": "Agent Tool",
              "include_output_in_agent_response": true,
              "type": "AgentTool",
              "parameters": {
                "max_iteration": "5"
              },
              "name": "AgentTool"
            }
          },
          {
            "id": "ml_model_tool",
            "type": "create_tool",
            "previous_node_inputs": {
              "register_model_2": "model_id"
            },
            "user_inputs": {
              "parameters": {
                "prompt": "\n\nHuman:\" turn\" You are an AI that only speaks JSON. Do not write normal text. Output should follow example JSON format: \n\n {\"response\": [\"question1\", \"question2\"]}\n\n. \n\nHuman:\" turn\":You will be given a chat history between OpenSearch Assistant and a Human.\nUse the context provided to generate follow up questions the Human would ask to the Assistant.\nThe Assistant can answer general questions about logs, traces and metrics.\nAssistant can access a set of tools listed below to answer questions given by the Human:\nQuestion suggestions generator tool\nHere's the chat history between the human and the Assistant.\n${parameters.AgentTool.output}\nUse the following steps to generate follow up questions Human may ask after the response of the Assistant:\nStep 1. Use the chat history to understand what human is trying to search and explore.\nStep 2. Understand what capabilities the assistant has with the set of tools it has access to.\nStep 3. Use the above context and generate follow up questions.Step4:You are an AI that only speaks JSON. Do not write normal text. Output should follow example JSON format: \n\n {\"response\": [\"question1\", \"question2\"]} \n \n----------------\n\nAssistant:"
              },
              "description": "A general tool to answer any question.",
              "alias": "language_model_tool",
              "include_output_in_agent_response": true,
              "name": "QuestionSuggestor",
              "type": "MLModelTool"
            }
          },
          {
            "id": "root_agent",
            "type": "register_agent",
            "previous_node_inputs": {
              "agent_tool": "tools",
              "register_model_2": "model_id",
              "ml_model_tool": "tools"
            },
            "user_inputs": {
              "parameters": {
                "prompt": "Answer the question as best you can."
              },
              "app_type": "chatbot",
              "name": "Root agent",
              "description": "this is the root agent",
              "tools_order": [
                "agent_tool",
                "ml_model_tool"
              ],
              "memory": {
                "type": "conversation_index"
              },
              "type": "flow"
            }
          },
          {
            "id": "ppl_agent",
            "type": "register_agent",
            "previous_node_inputs": {
              "TransferQuestionToPPLAndExecuteTool": "tools"
            },
            "user_inputs": {
              "parameters": {},
              "app_type": "query_assist",
              "name": "PPL agent",
              "description": "this is the PPL agent",
              "type": "flow"
            }
          }
        ],
        "edges": [
          {
            "source": "register_model_2",
            "dest": "rag_tool"
          }
        ]
      }
    }
  }
  ```

### How to create your own skill
1. To create your skill, you need to work backwards to see how that skill can be achieved by accessing different OpenSearch APIs/functions. For example, a skill to find the alerts related to a question would need to use the Alerting plugin APIs to get this info. 
1. To power the skill to get alerts, we must build a tool to search alerts.
1. To create a tool, you create it [here](https://github.com/opensearch-project/skills/tree/main/src/main/java/org/opensearch/agent/tools). [This is an example tool](https://github.com/opensearch-project/skills/blob/main/src/main/java/org/opensearch/agent/tools/SearchAlertsTool.java) that search alerts.
