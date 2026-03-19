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
