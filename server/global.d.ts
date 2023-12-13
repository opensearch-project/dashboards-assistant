/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

type RequiredKey<T, K extends keyof T> = T & Required<Pick<T, K>>;

// TODO remove when typescript is upgraded to >= 4.5
type Awaited<T> = T extends Promise<infer U> ? U : T;
type AgentResponse = Awaited<ReturnType<InstanceType<typeof AgentFactory>['run']>>;
