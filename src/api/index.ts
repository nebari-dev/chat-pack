/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import type {
  GetConfig
} from './config';

import type {
  DeleteMemories, GetMemories
} from './memory';

import type {
  GetMetrics
} from './metrics';

import type {
  ContinueRun, CreateRun, DeleteSessions, GetSessionDetail, GetSessionRuns,
  ListSessions
} from './session';


// Re-export the types from the sub-modules.
export * from './config';
export * from './memory';
export * from './metrics';
export * from './session';


/**
 * A type alias for the API functions.
 */
export
type API = {
  readonly getConfig: GetConfig;
  readonly getMemories: GetMemories;
  readonly deleteMemories: DeleteMemories;
  readonly getMetrics: GetMetrics;
  readonly listSessions: ListSessions;
  readonly deleteSessions: DeleteSessions;
  readonly getSessionDetail: GetSessionDetail;
  readonly getSessionRuns: GetSessionRuns;
  readonly createRun: CreateRun;
  readonly continueRun: ContinueRun;
};


/**
 * A provider component for the api functions.
 */
export
const APIProvider = createContext<API | undefined>(undefined);


/**
 * A hook that returns the api functions.
 */
export
function useAPI(): API {
  const api = useContext(APIProvider);
  if (api === undefined) {
    throw new Error('missing `APIProvider`');
  }
  return api;
}
