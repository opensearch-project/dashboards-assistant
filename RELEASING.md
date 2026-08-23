This project follows the [OpenSearch release process](https://github.com/opensearch-project/.github/blob/main/RELEASING.md).

## Release checklist

Once a release branch is cut, for example, `2.19`, release owner should initiate the repo release process as soon as possible. Take this checklist as a reference when releasing a new version.

> The release issue contains a checklist from a high level(e.g., [#363](https://github.com/opensearch-project/dashboards-assistant/issues/363)), make sure you checked and followed it whiling doing the release. This guide provides more detailed steps and can be used as a runbook.

### Summarize the release notes PR

Check `CHANGELOG.md` on `main` branch which all unreleased changes are list there:

- [ ] Create an empty release note file in `release-notes/` folder
- [ ] Move then entries from `CHANGELOG.md` to release note if the change is present in release branch, (e.g., 2.19).
- [ ] Clean up `CHANGELOG.md` by removing the moved entries after they have been added to the release notes.

### Add release tag to the original PR

When summarizing the release notes:

- [ ] For each change added to the release notes, locate its original PR to the main branch.
- [ ] Ensure the PR has the corresponding release tag (e.g., `v2.19.0`).
- [ ] If the tag is missing, add it accordingly.
