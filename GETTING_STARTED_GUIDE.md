## Getting started guide

### How to run assistant on your 2.12+ OpenSearch cluster

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
       "plugins.ml_commons.trusted_connector_endpoints_regex": [
         "^https://runtime\\.sagemaker\\..*[a-z0-9-]\\.amazonaws\\.com/.*$",
         "^https://api\\.openai\\.com/.*$",
         "^https://api\\.cohere\\.ai/.*$",
         "^https://bedrock-runtime\\.[a-z0-9-]+\\.amazonaws\\.com/.*$"
       ]
     }
   }
   ```
6. Call the flow framework plugin to setup the cluster for the assistant.
   1. See https://github.com/opensearch-project/flow-framework/tree/HEAD/sample-templates for sample templates. For setting up the chat assistant use the `observability-chat-agent` template, and for query assist feature use the `query-assist-agent` template.
   1. Note that other models from other services can be used instead.
   1. Note that if using the Bedrock model, IAM credentials need to be passed into the template to connect to Bedrock.

### How to create your own skill

1. To create your skill, you need to work backwards to see how that skill can be achieved by accessing different OpenSearch APIs/functions. For example, a skill to find the alerts related to a question would need to use the Alerting plugin APIs to get this info.
1. To power the skill to get alerts, we must build a tool to search alerts.
1. To create a tool, you create it [here](https://github.com/opensearch-project/skills/tree/main/src/main/java/org/opensearch/agent/tools). [This is an example tool](https://github.com/opensearch-project/skills/blob/main/src/main/java/org/opensearch/agent/tools/SearchAlertsTool.java) that search alerts.
