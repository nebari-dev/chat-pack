/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import {
  useCallback
} from 'react';

import * as v from 'valibot';

import {
  Chat
} from '@/components/chat';


/**
 * The route for the `/chat` endpoint.
 */
export
const Route = createFileRoute('/chat')({
  component: RouteComponent,
  validateSearch: v.object({
    session_id: v.fallback(
      v.optional(
        v.pipe(v.string(), v.uuid())
      ),
      undefined
    )
  })
});


/**
 * The component that renders the `/chat` route.
 */
function RouteComponent() {
  // Fetch the search parameters.
  const { session_id } = Route.useSearch();

  // Fetch the navigator.
  const navigate = Route.useNavigate();

  // TODO - allow changing the agent id.
  const agent_id = 'claude';

  // Create the callback to change the session id on the first message.
  const setSessionId = useCallback((session_id: string) => {
    navigate({ search: prev => ({ ...prev, session_id }) });
  }, []);

  // Return the rendered component.
  return (
    <Chat
      session_id={ session_id }
      agent_id={ agent_id }
      setSessionId={ setSessionId }/>
  );
}
