## Version 3.9.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.9.0

### Features

* Add configurable `assistant.chat.traceMaxResults` setting to control the number of agent trace steps returned ([#730](https://github.com/opensearch-project/dashboards-assistant/pull/730))

### Bug Fixes

* Remove manual sidecar CSS patch for flyout and bottom bar, deferring to global overlay-offset CSS variables ([#715](https://github.com/opensearch-project/dashboards-assistant/pull/715))

### Maintenance

* Bump brace-expansion from 5.0.8 to 5.0.9 ([#728](https://github.com/opensearch-project/dashboards-assistant/pull/728))
* Bump dompurify to ^3.4.12 to match OSD core and fix babel preset-env test config for BigInt compatibility ([#725](https://github.com/opensearch-project/dashboards-assistant/pull/725))
* Clean up resolutions and dependencies, align with OpenSearch Dashboards 3.8, and address CVEs ([#722](https://github.com/opensearch-project/dashboards-assistant/pull/722))
