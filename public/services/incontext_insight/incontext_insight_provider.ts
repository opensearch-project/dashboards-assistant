/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from 'react';
import { IncontextInsightRegistry } from './incontext_insight_registry';

export const IncontextInsightContext = createContext<IncontextInsightRegistry | undefined>(
  undefined
);

export const IncontextInsightProvider = IncontextInsightContext.Provider;

export type IncontextInsightProviderType = ReturnType<typeof IncontextInsightProvider>;
