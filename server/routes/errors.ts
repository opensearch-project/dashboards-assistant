/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class AgentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
