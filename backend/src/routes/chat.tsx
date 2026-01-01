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

import type {
  ChatConfig, ChatType
} from '@/components/chat';

import {
  Chat, ChatConfigProvider
} from '@/components/chat';


/**
 * The schema for the route search params.
 */
const searchSchema = v.object({
  type: v.fallback(
    v.union([
      v.literal('agent'),
      v.literal('team'),
      v.literal('workflow')
    ]),
    'agent'
  ),
  id: v.optional(
    v.string()
  ),
  sessionId: v.optional(
    v.pipe(v.string(), v.uuid())
  ),
});


/**
 * The route for the `/chat` endpoint.
 */
export
const Route = createFileRoute('/chat')({
  validateSearch: searchSchema,
  component: RouteComponent
});


/**
 * The component that renders the `/chat` route.
 */
function RouteComponent() {
  // Fetch the search parameters.
  const { type, id, sessionId } = Route.useSearch();

  // Fetch the navigator.
  const navigate = Route.useNavigate();

  // Create the callback for setting the `type` search param.
  const setType = useCallback((type: ChatType) => {
    navigate({ search: { type } });
  }, []);

  // Create the callback for setting the "agent id" search param.
  const setAgentId = useCallback((agentId: string) => {
    navigate({ search: { type: 'agent', id: agentId } });
  }, []);

  // Create the callback for setting the "team id" search param.
  const setTeamId = useCallback((teamId: string) => {
    navigate({ search: { type: 'team', id: teamId } });
  }, []);

  // Create the callback for setting the "workflow id" search param.
  const setWorkflowId = useCallback((workflowId: string) => {
    navigate({ search: { type: 'workflow', id: workflowId } });
  }, []);

  // Create the callback setting the `sessionId` search param.
  const setSessionId = useCallback((sessionId: string) => {
    navigate({ search: prev => ({ ...prev, sessionId }) });
  }, []);

  // Create the chat context.
  const context: ChatConfig = {
    type,
    setType,
    agentId: type === 'agent' ? id : undefined,
    setAgentId,
    teamId: type === 'team' ? id : undefined,
    setTeamId,
    workflowId: type === 'workflow' ? id : undefined,
    setWorkflowId,
    sessionId,
    setSessionId,
  };

  // Return the rendered component.
  return (
    <ChatConfigProvider value={ context }>
      <Chat />
    </ChatConfigProvider>
  );
}
