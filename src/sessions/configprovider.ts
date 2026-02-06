/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * A type alias for the sessions config.
 */
export
type SessionsConfig = {
  /**
   * The loaded sessions page from the api.
   */
  readonly page: api.SessionsPage;

  /**
   * The details for the currently selected session.
   *
   * This will be `null` if there is no selected session.
   */
  readonly detail: api.SessionDetail | null;

  /**
   * A function that deletes the provided sessions by id.
   */
  readonly deleteSessions: (ids: readonly string[]) => Promise<void>;
};


/**
 * The sessions config provider.
 */
export
const SessionsConfigProvider = createContext<SessionsConfig | undefined>(undefined);


/**
 * A hook which returns the sessions config.
 */
export
function useSessionsConfig(): SessionsConfig {
  const config = useContext(SessionsConfigProvider);
  if (config === undefined) {
    throw new Error('missing `SessionsConfigProvider`');
  }
  return config;
}
