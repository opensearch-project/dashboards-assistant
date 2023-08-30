/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  API_ROUTE_PREFIX,
  MONITOR_BASE_API,
  DESTINATION_BASE_API,
  EMAIL_ACCOUNT_BASE_API,
  EMAIL_GROUP_BASE_API,
  AD_BASE_API,
} from '../services/utils/alerting_constants';

export function OpenSearchAlertingPlugin(Client: any, config: any, components: any) {
  const ca = components.clientAction.factory;

  Client.prototype.alerting = components.clientAction.namespaceFactory();
  const alerting = Client.prototype.alerting.prototype;

  alerting.getFindings = ca({
    url: {
      fmt: `${API_ROUTE_PREFIX}/findings/_search`,
    },
    needBody: true,
    method: 'GET',
  });

  alerting.getMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.createMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.deleteMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  // TODO DRAFT: May need to add 'refresh' assignment here again.
  alerting.updateMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.getMonitors = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.acknowledgeAlerts = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>/_acknowledge/alerts`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  alerting.getAlerts = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/alerts`,
    },
    method: 'GET',
  });

  alerting.executeMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/_execute?dryrun=<%=dryrun%>`,
      req: {
        dryrun: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  alerting.getDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}/<%=destinationId%>`,
      req: {
        destinationId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.searchDestinations = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}`,
    },
    method: 'GET',
  });

  alerting.createDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.updateDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}/<%=destinationId%>?if_seq_no=<%=ifSeqNo%>&if_primary_term=<%=ifPrimaryTerm%>&refresh=wait_for`,
      req: {
        destinationId: {
          type: 'string',
          required: true,
        },
        ifSeqNo: {
          type: 'string',
          required: true,
        },
        ifPrimaryTerm: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.deleteDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}/<%=destinationId%>`,
      req: {
        destinationId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  alerting.getEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/<%=emailAccountId%>`,
      req: {
        emailAccountId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.getEmailAccounts = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.createEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.updateEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/<%=emailAccountId%>?if_seq_no=<%=ifSeqNo%>&if_primary_term=<%=ifPrimaryTerm%>&refresh=wait_for`,
      req: {
        emailAccountId: {
          type: 'string',
          required: true,
        },
        ifSeqNo: {
          type: 'string',
          required: true,
        },
        ifPrimaryTerm: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.deleteEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/<%=emailAccountId%>`,
      req: {
        emailAccountId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  alerting.getEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/<%=emailGroupId%>`,
      req: {
        emailGroupId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.getEmailGroups = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.createEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.updateEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/<%=emailGroupId%>?if_seq_no=<%=ifSeqNo%>&if_primary_term=<%=ifPrimaryTerm%>&refresh=wait_for`,
      req: {
        emailGroupId: {
          type: 'string',
          required: true,
        },
        ifSeqNo: {
          type: 'string',
          required: true,
        },
        ifPrimaryTerm: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.deleteEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/<%=emailGroupId%>`,
      req: {
        emailGroupId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  alerting.getDetector = ca({
    url: {
      fmt: `${AD_BASE_API}/<%=detectorId%>`,
      req: {
        detectorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.searchDetectors = ca({
    url: {
      fmt: `${AD_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.previewDetector = ca({
    url: {
      fmt: `${AD_BASE_API}/<%=detectorId%>/_preview`,
      req: {
        detectorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  alerting.searchResults = ca({
    url: {
      fmt: `${AD_BASE_API}/results/_search`,
    },
    needBody: true,
    method: 'POST',
  });
}
