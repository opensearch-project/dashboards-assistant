/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { MessageBubble } from './messages/message_bubble';

interface LoadingPlaceholderProps {
  loading: boolean;
  height: number;
  children?: ReactNode;
}

export const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({
  loading,
  height,
  children,
}: LoadingPlaceholderProps) => {
  if (loading) {
    return (
      <div
        style={{
          minHeight: height,
        }}
      >
        <MessageBubble loading showActionBar={false} />
        {children}
      </div>
    );
  }
  return null;
};
