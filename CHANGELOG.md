# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

### Unreleased
- fix: make sure $schema always added to LLM generated vega json object([252](https://github.com/opensearch-project/dashboards-assistant/pull/252))
- feat: expose a general function for agent execution([268](https://github.com/opensearch-project/dashboards-assistant/pull/268))
- Fix CVE-2024-4067 ([#269](https://github.com/opensearch-project/dashboards-assistant/pull/269))
- feat: add a dashboards-assistant trigger in query editor([265](https://github.com/opensearch-project/dashboards-assistant/pull/265))
- fix: make sure $schema always added to LLM generated vega json object([#252](https://github.com/opensearch-project/dashboards-assistant/pull/252))
- feat: added a new visualization type visualization-nlq to support creating visualization from natural language([#264](https://github.com/opensearch-project/dashboards-assistant/pull/264))
- feat: exposed an API to check if a give agent config name has configured with agent id([#307](https://github.com/opensearch-project/dashboards-assistant/pull/307))

### 📈 Features/Enhancements

- Add support for registerMessageParser ([#5](https://github.com/opensearch-project/dashboards-assistant/pull/5))
- Change implementation of basic_input_output to built-in parser ([#10](https://github.com/opensearch-project/dashboards-assistant/pull/10))
- Add interactions into ChatState and pass specific interaction into message_bubble ([#12](https://github.com/opensearch-project/dashboards-assistant/pull/12))
- Refactor the code to get root agent id by calling the API in ml-commons plugin ([#128](https://github.com/opensearch-project/dashboards-assistant/pull/128))
- Set verbose to false ([#131](https://github.com/opensearch-project/dashboards-assistant/pull/131))
- Fix: comply with the field change of agent framework ([#137](https://github.com/opensearch-project/dashboards-assistant/pull/137))
- Add incontext insight component ([#53](https://github.com/opensearch-project/dashboards-assistant/pull/53))
- Fetch root agent id before executing the agent ([#165](https://github.com/opensearch-project/dashboards-assistant/pull/165))
- Integrate chatbot with sidecar service ([#164](https://github.com/opensearch-project/dashboards-assistant/pull/164))
- Add data source service ([#191](https://github.com/opensearch-project/dashboards-assistant/pull/191))
- Update router and controller to support MDS ([#190](https://github.com/opensearch-project/dashboards-assistant/pull/190))
- Hide notebook feature when MDS enabled and remove security dashboard plugin dependency ([#201](https://github.com/opensearch-project/dashboards-assistant/pull/201))
- Refactor default data source retriever ([#197](https://github.com/opensearch-project/dashboards-assistant/pull/197))
- Add patch style for fixed components ([#203](https://github.com/opensearch-project/dashboards-assistant/pull/203))
- Reset chat and reload history after data source change ([#194](https://github.com/opensearch-project/dashboards-assistant/pull/194))
- Add experimental feature to support text to visualization ([#218](https://github.com/opensearch-project/dashboards-assistant/pull/218))
- Be compatible with ML configuration index mapping change ([#239](https://github.com/opensearch-project/dashboards-assistant/pull/239))
- Support context aware alert analysis by reusing incontext insight component([#215](https://github.com/opensearch-project/dashboards-assistant/pull/215))
- Use smaller and compressed variants of buttons and form components ([#250](https://github.com/opensearch-project/dashboards-assistant/pull/250))
- Support insight with RAG in alert analysis assistant and refine the UX ([#266](https://github.com/opensearch-project/dashboards-assistant/pull/266))
- Add assistant enabled capabilities to control rendering component([#267](https://github.com/opensearch-project/dashboards-assistant/pull/267))
- Add data to summary API([#295](https://github.com/opensearch-project/dashboards-assistant/pull/295))
- Refactor popover to add message action bar and add metrics to thumb-up and thumb-down([#304](https://github.com/opensearch-project/dashboards-assistant/pull/304))