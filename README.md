[![Forum](https://img.shields.io/badge/chat-on%20forums-blue)](https://forum.opensearch.org/t/feedback-opensearch-assistant/16741)
![PRs welcome!](https://img.shields.io/badge/PRs-welcome!-success)

<img src="https://opensearch.org/assets/brand/SVG/Logo/opensearch_logo_default.svg" height="64px"/>

- [OpenSearch Assistant Dashboards](#opensearch-assistant-dashboards)
- [Highlights](#highlights)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [Security](#security)
- [License](#license)
- [Copyright](#copyright)

# OpenSearch Assistant Dashboards

The OpenSearch Assistant Dashboards plugin lets you have an opensearch assistant to help dashboards users use OpenSearch.

## How to get started

See [getting started guide](GETTING_STARTED_GUIDE.md) to how to deploy this Assistant on your machine with docker images.
**Note** that the `feature/langchain` is the branch used in the getting started guide.

### Supported tools
This requires setting `assistant.chat.enabled` to `true` in `opensearch_dashboards.yml` to use these skills:
1. Query OpenSearch: Use to generate and run a PPL Query to get results for a generic user question related to data stored in their OpenSearch cluster.
2. Get log info: Use to get information of logs if the question contains an OpenSearch log index.
3. Get log error info: Use to get information of logs with errors if the question contains an OpenSearch log index.
4. Search Alerting Monitors By Index: Use this tool to search alerting monitors by index name in the OpenSearch cluster.
5. Get All Alerts: Use this tool to search all alerts triggered in the OpenSearch cluster.
6. Get ticket information: Use this tool to find tickets in the system with incidents that are relevant to a question about error causes. 
7. Get generic information: Use this tool to answer a generic question not related to OpenSearch cluster. This tool takes the question as input.
8. Get OpenSearch indices: Use this tool to get high-level information (e. health, status, index, docs.count) about indices in a cluster, including backing indices for data streams in the OpenSearch cluster.
9. Check OpenSearch index existence: Use this tool to check if a data stream, index, or alias exists in the OpenSearch cluster.
10. Find Visualizations: Use this tool to find user created visualizations.
11. Get trace groups: Use this to get information about each trace group.
12. Get traces: Use this to get information about each trace. 
13. Get trace services: Use this to get information about each service in trace analytics.

## Documentation

In the works.

## Contributing

See [developer guide](DEVELOPER_GUIDE.md) and [how to contribute to this project](CONTRIBUTING.md).

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## Security

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## License

This project is licensed under the [Apache v2.0 License](LICENSE).

## Copyright

Copyright OpenSearch Contributors. See [NOTICE](NOTICE) for details.