## Version 3.0.0.0-alpha1 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.0.0-alpha1

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

### Maintenance

- Bump version to 3.0.0.0-alpha1 ([#450](https://github.com/opensearch-project/dashboards-assistant/pull/450))
- chore(deps): update dependency dompurify to v3.2.4 ([#461](https://github.com/opensearch-project/dashboards-assistant/pull/461))
- chore(deps): update dependency dompurify to v3.2.3 ([#383](https://github.com/opensearch-project/dashboards-assistant/pull/383))
