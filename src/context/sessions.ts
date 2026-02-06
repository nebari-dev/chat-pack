/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * A type alias for the sessions context value.
 */
export
type SessionsContextValue = {
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
 * The sessions context.
 */
export
const SessionsContext = createContext<SessionsContextValue | undefined>(undefined);


/**
 * A hook which returns the sessions context value.
 */
export
function useSessions(): SessionsContextValue {
  const value = useContext(SessionsContext);
  if (value === undefined) {
    throw new Error('`useSessions` must be called within a `SessionsContext`');
  }
  return value;
}
