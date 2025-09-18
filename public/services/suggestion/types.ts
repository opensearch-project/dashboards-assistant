/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, ISuggestedAction } from '../../../common/types/chat_saved_object_attributes';

/**
 * Context information passed to suggestion providers
 */
export interface ChatContext {
  conversationId?: string;
  currentMessage?: IMessage;
  messageHistory: IMessage[];
  dataSourceId?: string;
  pageContext?: Record<string, string>; // context for current page
}

/**
 * Interface for plugins to implement when providing custom suggestions
 */
export interface ISuggestionProvider {
  /** Unique identifier for the provider */
  id: string;
  /** Priority for ordering suggestions (higher numbers appear first) */
  priority?: number;
  /** Method to get suggestions based on chat context */
  getSuggestions: (context: ChatContext) => Promise<ISuggestedAction[]> | ISuggestedAction[];
  /** Optional method to check if provider is enabled */
  isEnabled?: () => boolean;
}

/**
 * Extended suggestion action with provider metadata
 */
export interface ICustomSuggestedAction {
  /** Action type from the base suggestion */
  actionType: string;
  /** Message content from the base suggestion */
  message: string;
  /** Optional metadata from the base suggestion */
  metadata?: Record<string, unknown>;
  /** Priority for ordering this specific suggestion */
  priority?: number;
  /** Additional metadata for the suggestion */
  providerMetadata?: {
    pluginId: string;
    category?: string;
    [key: string]: unknown;
  };
}

/**
 * Contract interface for the suggestion service
 */
export interface SuggestionServiceContract {
  /** Register a new suggestion provider */
  registerProvider(provider: ISuggestionProvider): void;
  /** Unregister a suggestion provider by ID */
  unregisterProvider(providerId: string): void;
  /** Get all custom suggestions for the given context */
  getCustomSuggestions(context: ChatContext): Promise<ISuggestedAction[]>;
}
