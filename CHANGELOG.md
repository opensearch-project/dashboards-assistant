# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

### Unreleased
- fix: make sure $schema always added to LLM generated vega json object([252](https://github.com/opensearch-project/dashboards-assistant/pull/252))
- feat: expose a general function for agent execution([268](https://github.com/opensearch-project/dashboards-assistant/pull/268))
- Fix CVE-2024-4067 ([#269](https://github.com/opensearch-project/dashboards-assistant/pull/269))

### 📈 Features/Enhancements

- Add support for registerMessageParser ([#5](https://github.com/opensearch-project/dashboards-assistant/pull/5))
- Change implementation of basic_input_output to built-in parser ([#10](https://github.com/opensearch-project/dashboards-assistant/pull/10))
- Add interactions into ChatState and pass specific interaction into message_bubble ([#12](https://github.com/opensearch-project/dashboards-assistant/pull/12))
- Refactor the code to get root agent id by calling the API in ml-commons plugin ([#128](https://github.com/opensearch-project/dashboards-assistant/pull/128))
- build(deps): bump braces from 3.0.2 to 3.0.3 ([#213](https://github.com/opensearch-project/dashboards-assistant/pull/213))
- build(deps): bump ws from 8.16.0 to 8.18.0 ([#221](https://github.com/opensearch-project/dashboards-assistant/pull/221))