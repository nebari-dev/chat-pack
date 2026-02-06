/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as api from '@/api';

import {
  getConfig
} from './config';

import {
  deleteMemories, getMemories
} from './memory';

import {
  getMetrics
} from './metrics';

import {
  continueRun, createRun, deleteSessions, getSessionDetail, getSessionRuns,
  listSessions
} from './session';


/**
 * The api handlers for the Agno OS api.
 */
export
const agnoAPI: api.API = {
  getConfig,
  getMemories,
  deleteMemories,
  getMetrics,
  listSessions,
  deleteSessions,
  getSessionDetail,
  getSessionRuns,
  createRun,
  continueRun
};
