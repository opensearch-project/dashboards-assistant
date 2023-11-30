## Getting started guide

Below are the set of steps to run OpenSearch and OpenSearch dashboards with the OpenSearch assistant running correctly on the cluster.
**Note** that the `feature/langchain` is the branch used in this guide.

1. Follow steps here to setup docker for OpenSearch: https://opensearch.org/docs/latest/install-and-configure/install-opensearch/docker/
   1. Note: When running docker pull, use this command instead: `docker pull public.ecr.aws/w1m7p7g2/opensearch-reinvent2023:latest`


2. Follow steps here to setup docker to OpenSearch Dashboards: https://opensearch.org/docs/latest/install-and-configure/install-dashboards/docker/
   1. Note: When running docker pull, use this command instead for OSD: `docker pull public.ecr.aws/w1m7p7g2/opensearch-dashboards-reinvent2023:latest`
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
5. Add Trusted Endpoints (reference doc)
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
6. Create a connector (reference doc). The below example is for connecting to the AWS Bedrock Claude model. Keep note of the connector id from the API response. (Ensure the credentials passed should have access to call the LLM model) 
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
7. Create a model group with an example below (reference doc) and note the model group id.
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