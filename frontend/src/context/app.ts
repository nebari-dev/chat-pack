/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * The app config context.
 */
export
const AppConfigContext = createContext<api.AppConfig | undefined>(undefined);


/**
 * A hook which returns the app config.
 */
export
function useAppConfig(): api.AppConfig {
  const config = useContext(AppConfigContext);
  if (config === undefined) {
    throw new Error('`useAppConfig` must be called within an `AppConfigContext`');
  }
  return config;
}
