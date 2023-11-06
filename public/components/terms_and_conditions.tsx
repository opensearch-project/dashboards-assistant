/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useObservable } from 'react-use';
import { EuiButton, EuiEmptyPrompt, EuiLink, EuiText } from '@elastic/eui';
import { SavedObjectManager } from '../services/saved_object_manager';
import { useCore } from '../contexts/core_context';
import { ChatConfig } from '../types';
import { CHAT_CONFIG_SAVED_OBJECT_TYPE } from '../../common/constants/saved_objects';

interface Props {
  username: string;
}

export const TermsAndConditions = (props: Props) => {
  const core = useCore();

  const chatConfigService = SavedObjectManager.getInstance<ChatConfig>(
    core.services.savedObjects.client,
    CHAT_CONFIG_SAVED_OBJECT_TYPE
  );
  const config = useObservable(chatConfigService.get$(props.username));
  const loading = useObservable(chatConfigService.getLoadingStatus$(props.username));
  const termsAccepted = Boolean(config?.terms_accepted);

  return (
    <EuiEmptyPrompt
      style={{ padding: 0 }}
      iconType="cheer"
      iconColor="primary"
      titleSize="s"
      body={
        <EuiText color="default">
          <p>Welcome {props.username} to the OpenSearch Assistant</p>
          <p>I can help you analyze data, create visualizations, and get other insights.</p>
          <p>How can I help?</p>
          <EuiText size="xs" color="subdued">
            The OpenSearch Assistant may produce inaccurate information. Verify all information
            before using it in any environment or workload.
          </EuiText>
        </EuiText>
      }
      actions={[
        !termsAccepted && (
          <EuiButton
            isLoading={loading}
            color="primary"
            fill
            onClick={() =>
              chatConfigService.createOrUpdate(props.username, { terms_accepted: true })
            }
          >
            Accept terms & go
          </EuiButton>
        ),
        <EuiText size="xs">
          <EuiLink target="_blank" href="/">
            Terms & Conditions
          </EuiLink>
        </EuiText>,
      ].filter(Boolean)}
    />
  );
};
