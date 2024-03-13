## Getting started guide

### How to run assistant on your own machine
Below are the set of steps to run OpenSearch and OpenSearch dashboards with the OpenSearch assistant and the query generation functionality in the Observability Log Explorer page correctly on the cluster.

1. Setup a 2.12+ OpenSearch cluster with OpenSearch Dashboards by following the options here: https://opensearch.org/docs/latest/install-and-configure/
   1. Note: If you are using a min distribution, there are required OpenSearch and OpenSearch Dashboards plugin to run the assistant.
      1. Required OpenSearch plugins: ML-Commons, Flow Framework, Skill, SQL, and Observability
      2. Required OpenSearch Dashboard plugins: Dashboard Assistant, Dashboard Observability
2. Enable the following settings to enable the features:
   1. To enable the chat assistant feature, set `assistant.chat.enabled` to `true` in the `opensearch_dashboards.yml` file, and config the root agent id by calling the api as follows:
   ```http
   PUT /.plugins-ml-config/_doc/os_chat
   {
      "type":"os_chat_root_agent",
      "configuration":{
         "agent_id": "your root agent id"
      }
   }
   ```
   2. To enable the query assistant feature, set `observability.query_assist.enabled` to `true` in the `opensearch_dashboards.yml` file, and config the PPL agent id by calling the api as follows:
   ```http
   PUT /.plugins-ml-config/_doc/os_query_assist_ppl
   {
     "type":"os_query_assist_ppl_agent",
     "configuration":{
       "agent_id": "your ppl agent id"
     }
   }
   ```
   Optionally, you can also enable the summarization feature for PPL responses by setting `observability.summarize.enabled` to `true` in the `opensearch_dashboards.yml` file, then config the agent ids:
   ```http
   PUT /.plugins-ml-config/_doc/os_query_assist_response_summary
   {
     "type":"os_query_assist_response_summary_agent",
     "configuration":{
       "agent_id": "your response summary agent id"
     }
   }
   PUT /.plugins-ml-config/_doc/os_query_assist_error_summary
   {
     "type":"os_query_assist_error_summary_agent",
     "configuration":{
       "agent_id": "your error summary agent id"
     }
   }
   ```
3. After OpenSearch and OpenSearch Dashboards are running, we will setup ML Commons to connect to the LLM model
4. Run ML commons on Data node
   ```http
   PUT /_cluster/settings
   {
     "persistent" : {
     "plugins.ml_commons.only_run_on_ml_node":"false"
     }
   }
     ```
5. Add Trusted Endpoints ([reference doc](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/index/))
   ```http
   PUT /_cluster/settings
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
6. Create a connector ([reference doc](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/index/)). The below example is for connecting to the AWS Bedrock Claude model. Keep note of the connector id from the API response. (Ensure the credentials passed should have access to call the LLM model) 
   ```
   POST /_plugins/_ml/connectors/_create
   {
     "name": "BedRock test claude Connector",
     "description": "The connector to BedRock service for claude model",
     "version": 1,
     "protocol": "aws_sigv4",
     "parameters": {
        "region": "us-east-1",
        "service_name": "bedrock",
        "anthropic_version": "bedrock-2023-05-31",
        "endpoint": "bedrock.us-east-1.amazonaws.com",
        "auth": "Sig_V4",
        "content_type": "application/json",
        "max_tokens_to_sample": 8000,
        "temperature": 0.0001,
        "response_filter": "$.completion"
     },
     "credential": {
        "access_key": "<IAM access key>",
        "secret_key": "<IAM secret key"
     },
     "actions": [
        {
           "action_type": "predict",
           "method": "POST",
           "url": "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-instant-v1/invoke",
           "headers": {
              "content-type": "application/json",
              "x-amz-content-sha256": "required"
           },
           "request_body": "{\"prompt\":\"${parameters.prompt}\", \"max_tokens_to_sample\":${parameters.max_tokens_to_sample}, \"temperature\":${parameters.temperature},  \"anthropic_version\":\"${parameters.anthropic_version}\" }"
        }
     ]
   }
   ```
   1. If you are using AWS Bedrock, ensure the IAM user or IAM role used have these policy permissions. Feel free to restrict the resources to the specific endpoints you want ML Commons to connect to.
   ```
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Stmt1688544995813",
                "Action": [
                    "bedrock:ListBuiltInModels",
                    "bedrock:ListFoundationModels",
                    "bedrock:InvokeModel"
                ],
                "Effect": "Allow",
                "Resource": "*"
            }
       ]
   } 
   ```
7. Create a model group with an example below ([reference doc](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/index/)) and note the model group id.
   ```
   POST /_plugins/_ml/model_groups/_register
   {
     "name": "test_model_group_bedrock",
     "description": "This is a public model group"
   }
   ```
8. Create a model and note the model id
   ```
   POST /_plugins/_ml/models/_register
   {
     "name": "Bedrock Claude instant model",
     "function_name": "remote",
     "model_group_id": "<model group id from previous API call>",
     "description": "test model",
     "connector_id": "<connector id from previous API call>"
   }
   ```
9. Create Embedding Model and note the model id from the get tasks API call
   ```
   POST /_plugins/_ml/models/_register
   {
     "name": "huggingface/sentence-transformers/all-mpnet-base-v2",
     "version": "1.0.1",
     "model_group_id": "<model group id from previous API call>",
     "model_format": "TORCH_SCRIPT"
   }
     GET /_plugins/_ml/tasks/<task id from above model register call>
   ```
10. Deploy the LLM and embedding models. Confirm the model has been deployed with the task id from the response with the get tasks API call
   ```
   POST /_plugins/_ml/models/<llm_model_id>/_deploy
   POST /_plugins/_ml/models/<embedding_model_id>/_deploy

   GET /_plugins/_ml/tasks/<task id from above deploy model calls>
   ```
11. Test connection with calling the Predict API
   ```
   POST /_plugins/_ml/models/<llm_model_id>/_predict
   {
     "parameters": {
       "prompt": "\n\nHuman:hello\n\nnAssistant:"
     }
   }
   ```
12. Connect OS Assistant to the deployed models
   ```
   POST /.chat-assistant-config/_doc/model-config
   {
     "model_type":"claude_bedrock",
     "model_id":"<model-id>",
     "embeddings_model_id":"<embedding-model-id>"
   } 
   ```
### How to create your own skill
1. To create your skill, you need to work backwards to see how that skill can be achieved by accessing different OpenSearch APIs/functions. For example, a skill to find the alerts related to a question would need to use the Alerting plugin APIs to get this info. 
1. To power the skill to get alerts, we must build a tool to search alerts.
1. To create a tool, you create it [here](https://github.com/opensearch-project/skills/tree/main/src/main/java/org/opensearch/agent/tools). [This is an example tool](https://github.com/opensearch-project/skills/blob/main/src/main/java/org/opensearch/agent/tools/SearchAlertsTool.java) that search alerts.
