/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute, redirect, useRouter
} from '@tanstack/react-router';

import * as api from '@/api';

import type {
  SessionsContextValue
} from '@/context';

import {
  SessionsContext
} from '@/context';

import {
  Sessions
} from '@/sessions';


/**
 * The route for the `/sessions` endpoint.
 */
export
const Route = createFileRoute('/_authenticated/sessions/{-$sessionId}')({
  loader: async ({ context, params }) => {
    // Extract the query client.
    const { client } = context;

    // Unpack the params.
    const { sessionId } = params;

    // Fetch the sessions page.
    const page = await client.fetchQuery({
      queryKey: ['sessions'],
      queryFn: () => api.listSessions({})
    });

    // Redirect if the specified session id does not exist.
    //
    // TODO this is not fully correct because `listSessions` returns
    // a paginated response which might not include the otherwise valid
    // session id.
    if (sessionId && !page.sessions.find(s => s.sessionId === sessionId)) {
      throw redirect({
        to: '/sessions/{-$sessionId}',
        params: { sessionId: undefined }
      });
    }

    // Fetch the session detail, if needed.
    const detail = (
      sessionId !== undefined ?
      await client.fetchQuery({
        queryKey: ['session', sessionId],
        queryFn: () => api.getSessionDetail(sessionId)
      }) :
      null
    );

    // Return the loader data.
    return { page, detail };
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
  const { page, detail } = Route.useLoaderData();

  // Create the handler for deleting sessions.
  const deleteSessions = async (ids: readonly string[]) => {
    // Delete the sessions on the server.
    await api.deleteSessions(ids);

    // Force the router to reload the current data.
    await router.invalidate();
  };

  // Create the context value.
  const value: SessionsContextValue = { page, detail, deleteSessions };

  // Return the rendered component.
  return (
    <SessionsContext value={ value }>
      <Sessions />
    </SessionsContext>
  );
}
