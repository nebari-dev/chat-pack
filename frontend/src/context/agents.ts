/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createContext, useContext } from 'react';

import type * as api from '@/api';
import type {
  AuthoringModel,
  CatalogDatabase,
  CatalogMcpServer,
  CatalogTool,
} from '@/config';

/**
 * The configuration for the agents page.
 */
export type AgentsConfig = {
  /**
   * The models a user may pick when authoring an agent.
   */
  readonly models: readonly AuthoringModel[];

  /**
   * Built-in tools from the operator catalog.
   */
  readonly tools: readonly CatalogTool[];

  /**
   * MCP servers from the operator catalog.
   */
  readonly mcpServers: readonly CatalogMcpServer[];

  /**
   * Databases from the operator catalog.
   */
  readonly databases: readonly CatalogDatabase[];

  /**
   * Whether users may enter a custom MCP server URL.
   */
  readonly mcpEnabled: boolean;

  /**
   * Whether the current user may create and edit agents.
   */
  readonly canWrite: boolean;

  /**
   * Whether the current user may delete agents.
   */
  readonly canDelete: boolean;

  /**
   * Register a new agent from a definition.
   *
   * @returns The registered agent's config.
   */
  readonly createAgent: (
    definition: api.AgentDefinition,
  ) => Promise<api.AgentConfig>;

  /**
   * Replace an existing dynamic agent's definition.
   *
   * @returns The re-registered agent's config.
   */
  readonly replaceAgent: (
    agent: api.DynamicAgent,
    definition: api.AgentDefinition,
  ) => Promise<api.AgentConfig>;

  /**
   * Delete a dynamic agent by id.
   */
  readonly deleteAgent: (id: string) => Promise<void>;
};

/**
 * The agents config context.
 */
export const AgentsConfigContext = createContext<AgentsConfig | undefined>(
  undefined,
);

/**
 * A hook which returns the agents config.
 */
export function useAgentsConfig(): AgentsConfig {
  const config = useContext(AgentsConfigContext);
  if (config === undefined) {
    throw new Error(
      '`useAgentsConfig` must be called within an `AgentsConfigContext`',
    );
  }
  return config;
}
