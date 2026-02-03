# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## Unreleased

### Features
- Disable dashboards assistant chatbot if investigation feature flag enabled ([#626](https://github.com/opensearch-project/dashboards-assistant/pull/626))

### Enhancements
- Support log pattern in discover summary ([#550](https://github.com/opensearch-project/dashboards-assistant/pull/550))

### Bug Fixes
- detect serverless data source ([#627](https://github.com/opensearch-project/dashboards-assistant/pull/627))
- Fix capability services access settings before login and show dialog ([#628](https://github.com/opensearch-project/dashboards-assistant/pull/628))
- disable input panel and allow user click new conversation in error mode ([#639](https://github.com/opensearch-project/dashboards-assistant/pull/639))

### Infrastructure
- Add delete_backport_branch workflow to automatically delete branches that start with "backport/" or "release-chores/" after they are merged

### Documentation

### Maintenance

- Fix failed unit test due to React 18 upgrade ([#588](https://github.com/opensearch-project/dashboards-assistant/pull/642))

### Refactoring
