/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import { createContext, useContext } from 'react';

import type * as api from '@/api';

/**
 * The value held by the app config context.
 */
export type AppConfigValue = {
  /**
   * The list of available agents.
   */
  readonly agents: api.AgentConfig[];

  /**
   * The global backend application config (feature flags).
   */
  readonly config: api.AppConfig;
};

/**
 * The app config context.
 *
 * This context holds the list of available agents and the backend feature
 * flags, both loaded once by the authenticated route's loader.
 */
export const AppConfigContext = createContext<AppConfigValue | undefined>(
  undefined,
);

/**
 * A hook which returns the app config value.
 */
function useAppConfigValue(hook: string): AppConfigValue {
  const value = useContext(AppConfigContext);
  if (value === undefined) {
    throw new Error(
      `\`${hook}\` must be called within an \`AppConfigContext\``,
    );
  }
  return value;
}

/**
 * A hook which returns the available agents.
 *
 * @returns The array of agent configs.
 */
export function useAgents(): api.AgentConfig[] {
  return useAppConfigValue('useAgents').agents;
}

/**
 * A hook which returns the backend application config.
 *
 * @returns The global app config (e.g. `dynamicAgentsEnabled`).
 */
export function useAppConfig(): api.AppConfig {
  return useAppConfigValue('useAppConfig').config;
}
