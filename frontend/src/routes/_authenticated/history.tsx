/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute, useRouter
} from '@tanstack/react-router';

import {
  useMutation
} from '@tanstack/react-query';

import {
  useCallback
} from 'react';

import type {
  HistoryConfig
} from '@/context';

import {
  HistoryConfigContext
} from '@/context';

import {
  History
} from '@/history';

import {
  deleteThreadsMutation, threadPageQuery
} from '@/queries';


/**
 * The route for the `/history` endpoint.
 */
export
const Route = createFileRoute('/_authenticated/history')({
  loader: ({ context }) => {
    // TODO - support pagination query params
    const query = threadPageQuery({});
    return context.client.fetchQuery(query);
  },
  component: RouteComponent
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
  const deleteThreads = useCallback(async (ids: readonly string[]) => {
    // Run the mutation to delete the threads.
    await mutateAsync(ids);

    // Force the router to reload.
    await router.invalidate();
  }, [mutateAsync, router]);

  // Create the history config.
  const config: HistoryConfig = { page, deleteThreads };

  // Return the rendered component.
  return (
    <HistoryConfigContext value={ config }>
      <History />
    </HistoryConfigContext>
  );
}
