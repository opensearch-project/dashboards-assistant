## Version 3.0.0.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.0.0

### Features

- expose chatEnabled flag to capabilities ([#398](https://github.com/opensearch-project/dashboards-assistant/pull/398))
- update chatbot UI to align with new look ([#435](https://github.com/opensearch-project/dashboards-assistant/pull/435))
- add data to summary response post processing ([#436](https://github.com/opensearch-project/dashboards-assistant/pull/436))
- add flag to control if display conversation list ([#438](https://github.com/opensearch-project/dashboards-assistant/pull/438))
- when open chatbot, load the last conversation automatically ([#439](https://github.com/opensearch-project/dashboards-assistant/pull/439))
- add index type detection ([#454](https://github.com/opensearch-project/dashboards-assistant/pull/454))
- add error handling when open chatbot and loading conversation ([#485](https://github.com/opensearch-project/dashboards-assistant/pull/485))
- Generate visualization on t2v page mount ([#505](https://github.com/opensearch-project/dashboards-assistant/pull/505))
- Update insight badge ([#507](https://github.com/opensearch-project/dashboards-assistant/pull/507))

### Enhancements

- remove os_insight agent ([#452](https://github.com/opensearch-project/dashboards-assistant/pull/452))
- Hide the assistant entry when there isn't data2summary agent ([#417](https://github.com/opensearch-project/dashboards-assistant/pull/417))
- adjust buttons' padding inside alert in-context insight popover ([#467](https://github.com/opensearch-project/dashboards-assistant/pull/467))
- add a space to the left of the AI action menu button ([#486](https://github.com/opensearch-project/dashboards-assistant/pull/486))
- add a tooltip for disabled assistant action button ([#490](https://github.com/opensearch-project/dashboards-assistant/pull/490))
- improve the text to visualization error handling ([#491](https://github.com/opensearch-project/dashboards-assistant/pull/491))
- Optimize source selector width in t2v page ([#497](https://github.com/opensearch-project/dashboards-assistant/pull/497))
- Show error message if PPL query does not contain aggregation ([#499](https://github.com/opensearch-project/dashboards-assistant/pull/499))
- Adjust the overall style of alert summary popover ([#501](https://github.com/opensearch-project/dashboards-assistant/pull/501))
- Change the background color, button position and text for alert summary popover ([#506](https://github.com/opensearch-project/dashboards-assistant/pull/506))
- collect metrics for when t2viz triggered([#510](https://github.com/opensearch-project/dashboards-assistant/pull/510))
- chatbot dock bottom border top([#511](https://github.com/opensearch-project/dashboards-assistant/pull/511))
- update the no aggregation PPL error message([#512](https://github.com/opensearch-project/dashboards-assistant/pull/512))
- remove redundant error toast([#515](https://github.com/opensearch-project/dashboards-assistant/pull/515))
- Add auto suggested aggregation for text2Viz ([#514](https://github.com/opensearch-project/dashboards-assistant/pull/514))
- Remove experimental badge for natural language vis ([#516](https://github.com/opensearch-project/dashboards-assistant/pull/516))
- Revert "Add http error instruction for t2ppl task" ([#519](https://github.com/opensearch-project/dashboards-assistant/pull/519))
- t2viz remove fields clause from generated PPL query ([#525](https://github.com/opensearch-project/dashboards-assistant/pull/525))
- Render Icon based on the chat status ([#523](https://github.com/opensearch-project/dashboards-assistant/pull/523))
- Add scroll load conversations ([#530](https://github.com/opensearch-project/dashboards-assistant/pull/530))
- Refactor InContext style, add white logo and remove outdated code ([#529](https://github.com/opensearch-project/dashboards-assistant/pull/529))
- Change chatbot entry point to a single button ([#540](https://github.com/opensearch-project/dashboards-assistant/pull/540))
- Support streaming output([#493](https://github.com/opensearch-project/dashboards-assistant/pull/493))
- Update event names for t2v and feedback ([#543](https://github.com/opensearch-project/dashboards-assistant/pull/543))

### Bug Fixes

- fixed incorrect message id field used ([#378](https://github.com/opensearch-project/dashboards-assistant/pull/378))
- Improve alert summary with backend log pattern experience ([#389](https://github.com/opensearch-project/dashboards-assistant/pull/389))
- fixed in context feature returning 500 error if workspace is invalid to returning 4XX ([#429](https://github.com/opensearch-project/dashboards-assistant/pull/429))([#458](https://github.com/opensearch-project/dashboards-assistant/pull/458))
- fix incorrect insight API response ([#473](https://github.com/opensearch-project/dashboards-assistant/pull/473/files))
- Improve error handling for index type detection ([#472](https://github.com/opensearch-project/dashboards-assistant/pull/472))
- Fix header button input sending messages to active conversation ([#481](https://github.com/opensearch-project/dashboards-assistant/pull/481))
- Shrink source selector in t2v page ([#492](https://github.com/opensearch-project/dashboards-assistant/pull/492))
- Increase search selector width in t2v page ([#495](https://github.com/opensearch-project/dashboards-assistant/pull/495))
- Fix bottom spacing for chatbot flyout's input box ([#496](https://github.com/opensearch-project/dashboards-assistant/pull/496))
- Fix incontext insight popover close ([#498](https://github.com/opensearch-project/dashboards-assistant/pull/498))
- Fix error handling for data source connection errors ([#500](https://github.com/opensearch-project/dashboards-assistant/pull/500))
- Fix bug by hiding alert summary when clicking alert name ([#482](https://github.com/opensearch-project/dashboards-assistant/pull/482))
- Fix alert summary message action position when no discover button ([#504](https://github.com/opensearch-project/dashboards-assistant/pull/504))
- Remove text in badge to make it compatible with small screen ([#509](https://github.com/opensearch-project/dashboards-assistant/pull/509))
- remove experimental badge for vis-nlp ([#528](https://github.com/opensearch-project/dashboards-assistant/pull/528))
- Fix vertically alignment of alert insights popover title ([#526](https://github.com/opensearch-project/dashboards-assistant/pull/526))
- Change alert summary icon color to white ([#533](https://github.com/opensearch-project/dashboards-assistant/pull/533))
- Fix query assistant menu disappear due to upstream method signature change([#541]https://github.com/opensearch-project/dashboards-assistant/pull/541)
- Fix .plugins-ml-memory-meta not found when get conversations ([#542](https://github.com/opensearch-project/dashboards-assistant/pull/542))
- Fix save to notebook with MDS ([#554](https://github.com/opensearch-project/dashboards-assistant/pull/554))

### Infrastructure

- Fix failed UTs with OSD 3.0 ([#527](https://github.com/opensearch-project/dashboards-assistant/pull/527))
- Fix empty codecov report in CI([#547](https://github.com/opensearch-project/dashboards-assistant/pull/547))

### Maintenance

- Bump version to 3.0.0.0-alpha1 ([#450](https://github.com/opensearch-project/dashboards-assistant/pull/450))
- chore(deps): update dependency dompurify to v3.2.4 ([#461](https://github.com/opensearch-project/dashboards-assistant/pull/461))
- chore(deps): update dependency dompurify to v3.2.3 ([#383](https://github.com/opensearch-project/dashboards-assistant/pull/383))
- Bump version to 3.0.0.0-beta1 ([#521](https://github.com/opensearch-project/dashboards-assistant/pull/521))
- Bump version to 3.0.0.0 ([#559](https://github.com/opensearch-project/dashboards-assistant/pull/559))
- Upgrade derek-ho/start-opensearch to v6 and set java version to 21 for OS 3.0([#563](https://github.com/opensearch-project/dashboards-assistant/pull/563))
