/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute, useRouter
} from '@tanstack/react-router';

import {
  useAPI
} from '@/api';

import type {
  MemoriesConfig
} from '@/memories';

import {
  Memories, MemoriesConfigProvider
} from '@/memories';


/**
 * The route for the `/memories` endpoint.
 *
 * TODO handle pagination search params.
 */
export
const Route = createFileRoute('/_authenticated/memories')({
  component: RouteComponent,
  loader: ({ context }) => {
    return context.client.fetchQuery({
      queryKey: ['memories'],
      queryFn: () => context.API.getMemories({})
    });
  }
});


/**
 * The component that renders the `/memories` route.
 */
function RouteComponent() {
  // Fetch the router for the current endpoint.
  const router = useRouter();

  // Fetch the API.
  const API = useAPI();

  // Fetch the loader data.
  const data = Route.useLoaderData();

  // Create the handler for deleting memories.
  const deleteMemories = async (ids: readonly string[]) => {
    // Delete the memories on the server.
    await API.deleteMemories(ids);

    // Force the router to reload the current data.
    await router.invalidate();
  };

  // Create the memories config.
  const config: MemoriesConfig = { page: data, deleteMemories };

  // Return the rendered component.
  return (
    <MemoriesConfigProvider value={ config }>
      <Memories />
    </MemoriesConfigProvider>
  );
}
