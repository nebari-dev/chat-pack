/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * The app config context.
 *
 * This context holds the list of available agents.
 */
export
const AppConfigContext = createContext<api.AgentConfig[] | undefined>(undefined);


/**
 * A hook which returns the available agents.
 *
 * @returns The array of agent configs.
 */
export
function useAgents(): api.AgentConfig[] {
  const agents = useContext(AppConfigContext);
  if (agents === undefined) {
    throw new Error('`useAgents` must be called within an `AppConfigContext`');
  }
  return agents;
}
