/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from 'react';
import { PalantirRegistry } from './palantir_registry';

export const PalantirContext = createContext<PalantirRegistry | undefined>(undefined);

export const PalantirProvider = PalantirContext.Provider;

export type PalantirProviderType = ReturnType<typeof PalantirProvider>;
