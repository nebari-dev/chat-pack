/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  QueryClient
} from '@tanstack/react-query';

import {
  createFileRoute, redirect, useRouter
} from '@tanstack/react-router';

import * as v from 'valibot';

import * as api from '@/api';

import type {
  SessionsConfig
} from '@/sessions';

import {
  Sessions, SessionsConfigProvider
} from '@/sessions';


// The schema for the agent search params.
const agentSchema = v.object({
  type: v.literal('agent')
});


// The schema for the team search params.
const teamSchema = v.object({
  type: v.literal('team')
});


// The schema for the workflow search params.
const workflowSchema = v.object({
  type: v.literal('workflow')
});


// The schema for the `/sessions` route search params
const searchSchema = v.fallback(
  v.variant('type', [
    agentSchema,
    teamSchema,
    workflowSchema
  ]),
  { type: 'agent' }
);


/**
 * A query function which fetches the sessions list from the API.
 */
async function listSessions(
  client: QueryClient,
  type: 'agent' | 'team' | 'workflow'
): Promise<api.SessionsList> {
  // Create the sessions query.
  const sesssionsQuery = {
    queryKey: ['sessions', type],
    queryFn: () => api.listSessions({ type })
  } as const;

  // Fetch the query.
  return await client.fetchQuery(sesssionsQuery);
}


/**
 * A query function which fetches a specific session from the API.
 */
async function getSession(
  client: QueryClient,
  type: 'agent' | 'team' | 'workflow',
  sessionId: string
): Promise<api.SessionDetail> {
  // Create the session query.
  const sessionQuery = {
    queryKey: ['session', type, sessionId],
    queryFn: () => api.getSession({ type, sessionId })
  } as const;

  // Fetch the query.
  return await client.fetchQuery(sessionQuery);
}


/**
 * The route for the `/sessions` endpoint.
 */
export
const Route = createFileRoute('/_authenticated/sessions/{-$sessionId}')({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }) => {
    // Extract the query client from the context.
    const { client } = context;

    // Unpack the deps.
    const { type } = deps;

    // Unpack the params.
    const { sessionId } = params;

    // Fetch the sessions list.
    const sessions = await listSessions(client, type);

    // Redirect if the specified session id does not exist.
    //
    // TODO this is not fully correct because `listSessions` returns
    // a paginated response which might not include the otherwise valid
    // session id.
    if (sessionId && !sessions.data.find(s => s.session_id === sessionId)) {
      throw redirect({
        to: '/sessions/{-$sessionId}',
        params: { sessionId: undefined },
        search: s => s
      });
    }

    // Fetch the session detail, if needed.
    const detail = (
      sessionId !== undefined ?
      await getSession(client, type, sessionId) :
      null
    );

    // Return the loader data.
    return { type, sessions, detail };
  }
});


/**
 * The component that renders the `/sessions` route.
 */
function RouteComponent() {
  // Fetch the router for the current endpoint.
  const router = useRouter();

  // Fetch the loader data.
  const { type, sessions, detail } = Route.useLoaderData();

  // Create the handler for deleting sessions.
  const deleteSessions = async (options: api.deleteSessions.Options) => {
    // Delete the sessions on the server.
    await api.deleteSessions(options);

    // TODO delete the query cache for these sessions and chats.

    // Force the router to reload the current data.
    await router.invalidate();
  };

  // Create the sessions config.
  const config: SessionsConfig = {
    type, sessions, detail, deleteSessions
  };

  // Return the rendered component.
  return (
    <SessionsConfigProvider value={ config }>
      <Sessions />
    </SessionsConfigProvider>
  );
}
