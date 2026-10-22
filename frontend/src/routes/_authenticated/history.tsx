/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import { History } from '@/history';

import { allThreadsQuery } from '@/queries';

/**
 * The route for the `/history` endpoint.
 *
 * The loader warms the whole-history query so the table renders filled.
 * Search, filtering, sorting and paging happen in the table on the client.
 */
export const Route = createFileRoute('/_authenticated/history')({
  loader: ({ context }) => context.client.ensureQueryData(allThreadsQuery),
  component: RouteComponent,
});

/**
 * The component that renders the `/history` route.
 */
function RouteComponent(): ReactNode {
  return <History />;
}
