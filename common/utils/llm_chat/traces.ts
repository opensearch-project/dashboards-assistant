/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AgentFrameworkTrace {
  interactionId: string;
  parentInteractionId: string;
  createTime: string;
  input: string;
  output: string;
  origin: string;
  traceNumber: number;
}
