## Version 2.18.0.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards Version 2.18.0

### Features

- feat: Add new feature to support text to visualization([#264](https://github.com/opensearch-project/dashboards-assistant/pull/264),[#299](https://github.com/opensearch-project/dashboards-assistant/pull/299),[#310](https://github.com/opensearch-project/dashboards-assistant/pull/310),[#313](https://github.com/opensearch-project/dashboards-assistant/pull/313),[#325](https://github.com/opensearch-project/dashboards-assistant/pull/325),[#327](https://github.com/opensearch-project/dashboards-assistant/pull/327),[#330](https://github.com/opensearch-project/dashboards-assistant/pull/330),[#312](https://github.com/opensearch-project/dashboards-assistant/pull/312),[#350](https://github.com/opensearch-project/dashboards-assistant/pull/350),[#354](https://github.com/opensearch-project/dashboards-assistant/pull/354),[#351](https://github.com/opensearch-project/dashboards-assistant/pull/351))
- feat: take index pattern and user input to t2viz from discover([#349](https://github.com/opensearch-project/dashboards-assistant/pull/349))
- feat: Add discovery summary API([#295](https://github.com/opensearch-project/dashboards-assistant/pull/295))
- feat: Add metrics for alerting summary([#304](https://github.com/opensearch-project/dashboards-assistant/pull/304))
- feat: Add log pattern for alerting summary.([#339](https://github.com/opensearch-project/dashboards-assistant/pull/339), [#341](https://github.com/opensearch-project/dashboards-assistant/pull/341))
- feat: Add navigating to discover from alerting summary([#316](https://github.com/opensearch-project/dashboards-assistant/pull/316), [#337](https://github.com/opensearch-project/dashboards-assistant/pull/337),[#345](https://github.com/opensearch-project/dashboards-assistant/pull/345),[#347](https://github.com/opensearch-project/dashboards-assistant/pull/347))
- feat: Add alerting insight with RAG([#266](https://github.com/opensearch-project/dashboards-assistant/pull/266),[#343](https://github.com/opensearch-project/dashboards-assistant/pull/343))
- feat: Add an API to check if a give agent config name has agent id configured([#307](https://github.com/opensearch-project/dashboards-assistant/pull/307))
- feat: Add assistant capabilities to control rendering components([#267](https://github.com/opensearch-project/dashboards-assistant/pull/267))
- fix: Update alerting DSL verify mechanism([#359](https://github.com/opensearch-project/dashboards-assistant/pull/359))
- fix: Refactor contextProvider get to reduce re-fetch([#365](https://github.com/opensearch-project/dashboards-assistant/pull/365))


### Maintenance

- Increment version to 2.18.0.0([#315](https://github.com/opensearch-project/dashboards-assistant/pull/315))


### Fixes

- fix: Pass dataSourceId for alert summary/insight([#321](https://github.com/opensearch-project/dashboards-assistant/pull/321))
- fix: Fix dynamic uses of i18n([#335](https://github.com/opensearch-project/dashboards-assistant/pull/335))