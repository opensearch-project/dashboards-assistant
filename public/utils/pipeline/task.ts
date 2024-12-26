/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export abstract class Task<T, P> {
  abstract execute(v: T): Promise<P>;
}
