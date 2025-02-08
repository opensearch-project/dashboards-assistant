## Version 2.19.0.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards Version 2.19.0

### Features

- introduces Pipeline to execute asynchronous operations ([#376](https://github.com/opensearch-project/dashboards-assistant/pull/376))
- Add flags in the config to control trace view and feedback buttons in message bubbles ([#379](https://github.com/opensearch-project/dashboards-assistant/pull/379))
- feat: only support visual editor alerts to navigate to discover([#368](https://github.com/opensearch-project/dashboards-assistant/pull/368))
- feat: return 404 instead of 500 for missing agent config name([#384](https://github.com/opensearch-project/dashboards-assistant/pull/384))
- feat: Update UI for In-context summarization in Alerts table([#392](https://github.com/opensearch-project/dashboards-assistant/pull/392))
- feat: Hide "stop generation" and regenerate button based on feature flag([#394](https://github.com/opensearch-project/dashboards-assistant/pull/394))
- feat: Chatbot entry UI redesign([#396](https://github.com/opensearch-project/dashboards-assistant/pull/396))
- feat: Set logo config in assistant and read logo by config([#401](https://github.com/opensearch-project/dashboards-assistant/pull/401))
- feat: Update dropdown list button label and remove popover title([#407](https://github.com/opensearch-project/dashboards-assistant/pull/407))
- feat: Use feature flag to disable the delete conversation api([#409](https://github.com/opensearch-project/dashboards-assistant/pull/409))
- feat: Disable the rename conversation api using feature flag([#410](https://github.com/opensearch-project/dashboards-assistant/pull/410))
- Add query assistant summary to the assistant dropdown list ([#395](https://github.com/opensearch-project/dashboards-assistant/pull/395))

### Maintenance

- Increment version to 2.19.0.0([#375](https://github.com/opensearch-project/dashboards-assistant/pull/375))
- Bump cross-spawn from 6.0.5 and 7.0.3 to 7.0.5([#418](https://github.com/opensearch-project/dashboards-assistant/pull/418))
- Bump cross-spawn from 7.0.3 to 7.0.5([#421](https://github.com/opensearch-project/dashboards-assistant/pull/421))

### Fixes

- fix: Fix returns 500 error for AI agent APIs when OpenSearch returns 4xx error with json format error message([#380](https://github.com/opensearch-project/dashboards-assistant/pull/380))
- fix: Fix chatbot flyout not show after re-mount([#399](https://github.com/opensearch-project/dashboards-assistant/pull/399))
