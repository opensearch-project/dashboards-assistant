## Version 3.8.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.8.0

### Bug Fixes

* Add @hapi/hoek module name mapper to Jest config for hapi 21 compatibility and fix CI with correct commit SHA ([#700](https://github.com/opensearch-project/dashboards-assistant/pull/700))

### Infrastructure

* Migrate Jest test suite to Jest 30 and jsdom 26 ([#717](https://github.com/opensearch-project/dashboards-assistant/pull/717))
* Adopt ESLint 10 flat config format ([#711](https://github.com/opensearch-project/dashboards-assistant/pull/711))
* Onboard new backport-pr reusable GitHub workflow ([#705](https://github.com/opensearch-project/dashboards-assistant/pull/705))
* Use correct OSD main branch reference in workflow ([#712](https://github.com/opensearch-project/dashboards-assistant/pull/712))

### Maintenance

* Bump ws from 8.20.0 to 8.21.0 to fix remote memory exhaustion DoS vulnerability ([#686](https://github.com/opensearch-project/dashboards-assistant/pull/686))
