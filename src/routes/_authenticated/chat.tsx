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
} from '@/chat';

import type {
  ChatConfig
} from '@/context';

import {
  ChatConfigContext
} from '@/context';



// The schema for the `/chat` route search params
const searchSchema = v.object({
  agentId: v.optional(v.string()),
  sessionId: v.optional(v.string())
});


/**
 * The route for the `/chat` endpoint.
 */
export
const Route = createFileRoute('/_authenticated/chat')({
  validateSearch: searchSchema,
  component: RouteComponent,
});


/**
 * The component that renders the `/chat` route.
 */
function RouteComponent() {
  // Fetch the search parameters.
  const { agentId, sessionId } = Route.useSearch();

  // Fetch the navigator.
  const navigate = Route.useNavigate();

  // Create the callback for updating the chat config.
  const update = useCallback((options: ChatConfig.UpdateOptions) => {
    navigate({ search: { ...options } });
  }, []);

  // Create the chat config.
  const chatConfig: ChatConfig = { agentId, sessionId, update };

  // Return the rendered component.
  return (
    <ChatConfigContext value={ chatConfig }>
      <Chat />
    </ChatConfigContext>
  );
}
