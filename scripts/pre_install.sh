#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

cp -r scripts/assistant ../../scripts

SUPPORTED_VERSION=$(yarn --silent osd-version)

echo "Plugin supports OpenSearch Dashboards v$SUPPORTED_VERSION" 
read -n 1 -p "Would you like to force OpenSearch and OpenSearch Dashboards v$SUPPORTED_VERSION? [y/n] " REPLY
if [[ $REPLY =~ ^[Yy]$ ]]
then
   sed -i -E "s|(\"version\": \")[^\"]*|\1${SUPPORTED_VERSION}|" ../../package.json
fi

echo
echo "Pre-install complete. Please start with 'yarn start:assistant' from OSD root" 


