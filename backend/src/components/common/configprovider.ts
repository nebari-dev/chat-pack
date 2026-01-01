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
export
const ConfigProvider = createContext<api.Config | undefined>(undefined);


/**
 * A hook which returns the config context.
 */
export
function useConfig(): api.Config {
  const config = useContext(ConfigProvider);
  if (config === undefined) {
    throw new Error('missing `ConfigProvider`');
  }
  return config;
}
