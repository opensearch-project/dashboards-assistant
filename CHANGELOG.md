# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## Unreleased


### Features

- introduces Pipeline to execute asynchronous operations ([#376](https://github.com/opensearch-project/dashboards-assistant/pull/376))
- Chatbot entry UI redesign ([#396](https://github.com/opensearch-project/dashboards-assistant/pull/396))

### Enhancements

- feat: Hide navigate to discover button if alert is not from visual editor monitor([#368](https://github.com/opensearch-project/dashboards-assistant/pull/368))
- Add flags in the config to control trace view and feedback buttons in message bubbles ([#379](https://github.com/opensearch-project/dashboards-assistant/pull/379))
- feat: Update UI for In-context summarization in Alerts table([#392](https://github.com/opensearch-project/dashboards-assistant/pull/392))
- Set logo config and read logo by config([#401](https://github.com/opensearch-project/dashboards-assistant/pull/401))
- Use feature flag to disable the rename conversation api ([#401](https://github.com/opensearch-project/dashboards-assistant/pull/410))
- Disable delete conversation api based on feature flag([#409](https://github.com/opensearch-project/dashboards-assistant/pull/409))


### Bug Fixes

- Optimize the response of AI agent APIs ([#373](https://github.com/opensearch-project/dashboards-assistant/pull/373), [#380](https://github.com/opensearch-project/dashboards-assistant/pull/380))
- fixed incorrect message id field used ([#378](https://github.com/opensearch-project/dashboards-assistant/pull/378))
- fix: return 404 instead of 500 for missing agent config name ([#384](https://github.com/opensearch-project/dashboards-assistant/pull/384))
- Improve alert summary with backend log pattern experience ([#389](https://github.com/opensearch-project/dashboards-assistant/pull/389))
- Fix chatbot flyout not show after re-mount ([#399](https://github.com/opensearch-project/dashboards-assistant/pull/399))

### Infrastructure

### Documentation

### Maintenance

### Refactoring
- Add query assistant summary to the assistant dropdown list ([#395](https://github.com/opensearch-project/dashboards-assistant/pull/395))
- Update dropdown list button label and remove popover title ([#407](https://github.com/opensearch-project/dashboards-assistant/pull/407))
- Add support for registerMessageParser ([#5](https://github.com/opensearch-project/dashboards-assistant/pull/5))
- Change implementation of basic_input_output to built-in parser ([#10](https://github.com/opensearch-project/dashboards-assistant/pull/10))
- Add interactions into ChatState and pass specific interaction into message_bubble ([#12](https://github.com/opensearch-project/dashboards-assistant/pull/12))
- Refactor the code to get root agent id by calling the API in ml-commons plugin ([#128](https://github.com/opensearch-project/dashboards-assistant/pull/128))
- build(deps): bump braces from 3.0.2 to 3.0.3 ([#213](https://github.com/opensearch-project/dashboards-assistant/pull/213))
- build(deps): bump ws from 8.16.0 to 8.18.0 ([#221](https://github.com/opensearch-project/dashboards-assistant/pull/221))


