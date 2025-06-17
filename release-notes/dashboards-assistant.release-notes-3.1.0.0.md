## Version 3.1.0.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.1.0

### Enhancements

- Style single metric in text2vis ([#539](https://github.com/opensearch-project/dashboards-assistant/pull/539))
- Buffer for special characters ([#549](https://github.com/opensearch-project/dashboards-assistant/pull/549))
- Save chatbot flyout visualize state to local storage ([#553](https://github.com/opensearch-project/dashboards-assistant/pull/553))
- T2viz supports reading time range from context ([#557](https://github.com/opensearch-project/dashboards-assistant/pull/557/))
- Prevent user from navigating to t2viz from discover if ppl return no results/error ([#546](https://github.com/opensearch-project/dashboards-assistant/pull/546))
- Improve the chatbot UX by scroll the user input message to the top after sending ([#545](https://github.com/opensearch-project/dashboards-assistant/pull/545))
- Add format instruction for alert summary ([#568](https://github.com/opensearch-project/dashboards-assistant/pull/568))
- Add the admin UI setting option for control all dashboard assistant features ([#578](https://github.com/opensearch-project/dashboards-assistant/pull/578))

### Bug Fixes

- Fix unnecessary embeddable in create new dropdown ([#579](https://github.com/opensearch-project/dashboards-assistant/pull/579))
- log error body or message instead of the entire error object ([#548](https://github.com/opensearch-project/dashboards-assistant/pull/548))
- Fix http request for insights to be triggered only after view insights button is clicked ([#520](https://github.com/opensearch-project/dashboards-assistant/pull/520))
- Fix chat page conversation loading state ([#569](https://github.com/opensearch-project/dashboards-assistant/pull/569))

### Infrastructure

- fix(ci): fixed failed ci due to path alias ([#580](https://github.com/opensearch-project/dashboards-assistant/pull/580))

### Maintenance

- Bump version to 3.1.0.0 ([#572](https://github.com/opensearch-project/dashboards-assistant/pull/572))