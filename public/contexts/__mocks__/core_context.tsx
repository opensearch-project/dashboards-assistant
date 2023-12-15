/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { coreMock } from '../../../../../src/core/public/mocks';

export const useCore = jest.fn(() => {
  const useCoreMock = {
    services: {
      ...coreMock.createStart(),
      sessions: {
        sessions$: new BehaviorSubject({
          objects: [
            {
              id: '1',
              title: 'foo',
            },
          ],
          total: 1,
        }),
        status$: new BehaviorSubject('idle'),
        load: jest.fn(),
      },
      sessionLoad: {},
    },
  };
  useCoreMock.services.http.delete.mockReturnValue(Promise.resolve());
  useCoreMock.services.http.put.mockReturnValue(Promise.resolve());
  return useCoreMock;
});
