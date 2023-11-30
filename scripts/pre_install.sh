#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

[ -z "$SUPPORTED_VERSION" ] && SUPPORTED_VERSION="2.11.0"

cp -r scripts/assistant ../../scripts
sed -i -E "s|(\"version\": \")[^\"]*|\1${SUPPORTED_VERSION}|" ../../package.json
