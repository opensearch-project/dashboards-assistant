/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const API_ROUTE_PREFIX = '/_plugins/_alerting';
export const MONITOR_BASE_API = `${API_ROUTE_PREFIX}/monitors`;
export const AD_BASE_API = `/_plugins/_anomaly_detection/detectors`;
export const DESTINATION_BASE_API = `${API_ROUTE_PREFIX}/destinations`;
export const EMAIL_ACCOUNT_BASE_API = `${DESTINATION_BASE_API}/email_accounts`;
export const EMAIL_GROUP_BASE_API = `${DESTINATION_BASE_API}/email_groups`;
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'OpenSearch-Dashboards',
};
export const CLUSTER = {
  ADMIN: 'admin',
  ALERTING: 'opensearch_alerting',
  AD_ALERTING: 'alerting_ad',
  DATA: 'data',
};
