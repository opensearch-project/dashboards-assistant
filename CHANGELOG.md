# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## Unreleased

### Features
- Disable dashboards assistant chatbot if investigation feature flag enabled ([#626](https://github.com/opensearch-project/dashboards-assistant/pull/626))

### Enhancements
- Support log pattern in discover summary ([#550](https://github.com/opensearch-project/dashboards-assistant/pull/550))

- Buffer for special characters ([#549](https://github.com/opensearch-project/dashboards-assistant/pull/549))
- Save chatbot flyout visualize state to local storage ([#553](https://github.com/opensearch-project/dashboards-assistant/pull/553))
- T2viz supports reading time range from context ([#557](https://github.com/opensearch-project/dashboards-assistant/pull/557/))
- Prevent user from navigating to t2viz from discover if ppl return no results/error ([#546](https://github.com/opensearch-project/dashboards-assistant/pull/546))
- Improve the chatbot UX by scroll the user input message to the top after sending ([#545](https://github.com/opensearch-project/dashboards-assistant/pull/545))
- Add format instruction for alert summary ([#568](https://github.com/opensearch-project/dashboards-assistant/pull/568))
- Add the admin UI setting option for control all dashboard assistant features ([#578](https://github.com/opensearch-project/dashboards-assistant/pull/578))
- Enhance chatbot message top-scrolling in full screen mode ([#576](https://github.com/opensearch-project/dashboards-assistant/pull/576))

### Bug Fixes
- detect serverless data source ([#627](https://github.com/opensearch-project/dashboards-assistant/pull/627))

### Infrastructure
- Add delete_backport_branch workflow to automatically delete branches that start with "backport/" or "release-chores/" after they are merged

### Documentation

### Maintenance

### Refactoring
