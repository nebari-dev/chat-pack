/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';

/**
 * The config context provider.
 */
export const ConfigContext = createContext<api.AgentConfig | undefined>(undefined);

export function useDetailConfig(): api.AgentConfig {
  const config = useContext(ConfigContext);
  if (!config) throw new Error("missing ConfigContext provider");
  return config;
}
