/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute, redirect
} from '@tanstack/react-router';

import * as z from 'zod';

import * as api from '@/api';

import {
  Chat
} from '@/chat';

import {
  ChatConfigContext
} from '@/context';

import {
  agentsQuery, threadQuery
} from '@/queries';


// The schema for the `/chat` route search params
const searchSchema = z.object({
  agentId: z.string().optional(),
  threadId: z.string().optional(),
  detailId: z.string().optional()
});


/**
 * The route for the `/chat` endpoint.
 */
export
const Route = createFileRoute('/_authenticated/chat')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: async ({ context, search }) => {
    // Extract the query client.
    const { client } = context;

    // Extract the search params.
    const { agentId, threadId } = search;

    // Fetch the agents for the application.
    const agents = await client.fetchQuery(agentsQuery);

    // Fetch the thread for the query.
    //
    // If the `threadId` is `undefined` the fetch will return `null`.
    //
    // If the fetch throws, redirect to an empty thread.
    let thread: api.Thread | null;
    try {
      thread = await client.fetchQuery(threadQuery(threadId));
    } catch {
      throw redirect({
        replace: true,
        search: { agentId }
      });
    }

    // Branch based on whether a thread was loaded.
    if (thread) {
      // If the `agentId` matches the loaded thread, we are done.
      if (thread.agentId === agentId) {
        return;
      }

      // Otherwise, redirect to sync the `agentId` with the thread.
      throw redirect({
        replace: true,
        search: { agentId: thread.agentId, threadId: thread.id }
      });
    } else {
      // If the `agentId` is valid, we are done.
      if (agents.some(a => a.id === agentId)) {
        return;
      }

      // Otherwise, redirect to the first available agent.
      throw redirect({
        replace: true,
        search: { agentId: agents[0].id }
      });
    }
  },
  loader: async ({ context, deps }) => {
    // Extract the query client.
    const { client } = context;

    // Extract the search params.
    const { agentId, threadId, detailId } = deps;

    // Fetch the thread.
    const thread = await client.fetchQuery(threadQuery(threadId));

    // Return the loaded data. The `beforeLoad` handler ensures
    // that the `agentId` is valid and is synced with the thread.
    return { thread, agentId: agentId!, detailId };
  },
  component: RouteComponent
});


/**
 * The component that renders the `/chat` route.
 */
function RouteComponent() {
  // Fetch the loader data.
  const config = Route.useLoaderData();

  // Return the rendered component.
  return (
    <ChatConfigContext value={ config }>
      <Chat />
    </ChatConfigContext>
  );
}
