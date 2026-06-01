/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  queryOptions
} from '@tanstack/react-query';

import * as api from '@/api';


/**
 * A query for fetching the application config.
 */
export
const appConfigQuery = queryOptions({
  queryKey: ['/api/config'],
  queryFn: api.getAppConfig,
  staleTime: 'static'
});


/**
 * A query for fetching the available agents.
 */
export
const agentsQuery = queryOptions({
  queryKey: ['/api/agents'],
  queryFn: api.getAgents,
  staleTime: 1000 * 60 // 1min
});


/**
 * A query for fetching the current user and permissions.
 */
export
const userQuery = queryOptions({
  queryKey: ['/api/user'],
  queryFn: api.getUser,
  staleTime: 1000 * 60 // 1min
});
