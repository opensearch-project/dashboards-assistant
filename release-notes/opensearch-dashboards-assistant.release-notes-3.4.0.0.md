## Version 3.4.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.4.0

### Features
* Disable dashboards assistant chatbot if investigation feature flag enabled ([#626](https://github.com/opensearch-project/dashboards-assistant/pull/626))

### Enhancements
* Support log pattern in discover summary ([#550](https://github.com/opensearch-project/dashboards-assistant/pull/550))

### Bug Fixes
* Detect serverless data source ([#627](https://github.com/opensearch-project/dashboards-assistant/pull/627))
* Fix capability services access settings before login and show dialog ([#628](https://github.com/opensearch-project/dashboards-assistant/pull/628))

### Infrastructure
* Add delete_backport_branch workflow to automatically delete branches that start with "backport/" or "release-chores/" after they are merged