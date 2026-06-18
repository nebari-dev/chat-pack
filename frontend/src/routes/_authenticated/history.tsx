/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';

import { useCallback } from 'react';

import * as z from 'zod';

import type { HistoryConfig } from '@/context';

import { HistoryConfigContext } from '@/context';

import { History } from '@/history';

import { deleteThreadsMutation, threadPageQuery } from '@/queries';

// The schema for the `/history` route search params.
//
// These drive server-side pagination and sorting. They are validated by the
// router and default to showing the most recent threads first.
const searchSchema = z.object({
  pageSize: z.number().int().positive().default(10),
  pageNumber: z.number().int().positive().default(1),
  sortBy: z.enum(['createdAt', 'name', 'agentId']).default('createdAt'),
  sortOrder: z.enum(['ascending', 'descending']).default('descending'),
});

/**
 * The route for the `/history` endpoint.
 */
export const Route = createFileRoute('/_authenticated/history')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const query = threadPageQuery(deps);
    return context.client.fetchQuery(query);
  },
  component: RouteComponent,
});

/**
 * The component that renders the `/sessions` route.
 */
function RouteComponent() {
  // Fetch the router for the current endpoint.
  const router = useRouter();

  // Fetch the loader data.
  const page = Route.useLoaderData();

  // Get the mutation for deleting threads.
  const { mutateAsync } = useMutation(deleteThreadsMutation);

  // Create the handler for deleting threads.
  const deleteThreads = useCallback(
    async (ids: readonly string[]) => {
      // Run the mutation to delete the threads.
      await mutateAsync(ids);

      // Force the router to reload.
      await router.invalidate();
    },
    [mutateAsync, router],
  );

  // Create the history config.
  const config: HistoryConfig = { page, deleteThreads };

  // Return the rendered component.
  return (
    <HistoryConfigContext value={config}>
      <History />
    </HistoryConfigContext>
  );
}
