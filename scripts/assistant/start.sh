#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

. scripts/assistant/utils.sh
. scripts/assistant/add_model.sh

RED_COLOR='\033[0;31m'
GREEN_COLOR='\033[0;32m'
NO_COLOR='\033[0m'

function usage() {
    echo ""
    echo "This script is used to run OpenSearch Assistant"
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Optional arguments:"
    echo -e "-b BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-c CREDENTIAL\t(username:password), defaults to admin:admin"
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":h:b:p:c:" arg; do
    case $arg in
        h)
            usage
            exit 1
            ;;
        b)
            BIND_ADDRESS=$OPTARG
            ;;
        p)
            BIND_PORT=$OPTARG
            ;;
        c)
            CREDENTIAL=$OPTARG
            ;;
      :)
            echo "-${OPTARG} requires an argument"
            usage
            exit 1
            ;;
        ?)
            echo "Invalid option: -${OPTARG}"
            exit 1
            ;;
    esac
done

[ -z "$ACCESS_KEY_ID" ] && ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
[ -z "$SECRET_ACCESS_KEY" ] && SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
[ -z "$SESSION_TOKEN" ] && SESSION_TOKEN=${AWS_SESSION_TOKEN}

[ -z "$ACCESS_KEY_ID" ] && echo -e "[ ${RED_COLOR}Error${NO_COLOR}: requires env variable: ACCESS_KEY_ID ]" && exit 1
[ -z "$SECRET_ACCESS_KEY" ] && echo -e "[ ${RED_COLOR}Error${NO_COLOR}: requires env variable: SECRET_ACCESS_KEY ]" && exit 1

[ -z "$BIND_ADDRESS" ] && BIND_ADDRESS="localhost"
[ -z "$BIND_PORT" ] && BIND_PORT="9200"
[ -z "$REGION" ] && REGION="us-west-2"
if [ -z "$CREDENTIAL" ]
then
  CREDENTIAL="admin:admin"
  USERNAME=`echo $CREDENTIAL | awk -F ':' '{print $1}'`
  PASSWORD=`echo $CREDENTIAL | awk -F ':' '{print $2}'`
fi

PARENT_PID_LIST=()

PACKAGE_VERSION=$(yarn --silent pkg-version)

# define assistant path
CWD=$(pwd)
SNAPSHOT_DIR="$CWD/.opensearch"
LOGS_DIR="$SNAPSHOT_DIR/$PACKAGE_VERSION/logs"

# Main function
function execute() {
  export initialAdminPassword=$PASSWORD
  CLUSTER_SETTINGS="snapshot --assistant --security"
  CLUSTER_SETTINGS+=" -E plugins.ml_commons.only_run_on_ml_node=false"
  CLUSTER_SETTINGS+=" -E plugins.ml_commons.memory_feature_enabled=true"
  
  run_opensearch || clean
  check_opensearch_status
  echo "[ Attempting to add models... ]"
  (add_model > $LOGS_DIR/add_model.log 2>&1 || clean) & 
  echo "Results found in $LOGS_DIR/add_model.log"

  export OPENSEARCH_USERNAME=kibanaserver
  export OPENSEARCH_PASSWORD=kibanaserver
  echo "[ Starting OpenSearch Dashboards... ]"
  OSD_SETTINGS="--dev --security --assistant.chat.enabled=true"
  OSD_SETTINGS+=" --home.newHomepage=true"
  eval "$CWD/scripts/use_node $CWD/scripts/opensearch_dashboards $OSD_SETTINGS" || clean
}

execute
clean
exit 0