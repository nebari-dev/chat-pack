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
  ChatConfig, ChatConfigUpdateOptions
} from '@/components/chat';

import {
  Chat, ChatConfigProvider
} from '@/components/chat';

import {
  useConfig
} from '@/components/common';


// The schema for the agent search params
const agentSchema = v.object({
  type: v.literal('agent'),
  id: v.string(),
  sessionId: v.optional(v.string())
});


// The schema for the team search params
const teamSchema = v.object({
  type: v.literal('team'),
  id: v.string(),
  sessionId: v.optional(v.string())
});


// The schema for the workflow search params
const workflowSchema = v.object({
  type: v.literal('workflow'),
  id: v.string(),
  sessionId: v.optional(v.string())
});


// The schema for empty search params
const emptySchema = v.object({
  type: v.undefined(),
  id: v.undefined(),
  sessionId: v.undefined()
});


// The schema for the `/chat` route search params
const searchSchema = v.fallback(
  v.variant('type', [
    agentSchema,
    teamSchema,
    workflowSchema,
    emptySchema
  ]),
  { type: undefined, id: undefined, sessionId: undefined }
);


/**
 * The route for the `/chat` endpoint.
 */
export
const Route = createFileRoute('/chat')({
  validateSearch: searchSchema,
  component: RouteComponent,
});


/**
 * The component that renders the `/chat` route.
 */
function RouteComponent() {
  // Fetch the search parameters.
  const { type, id, sessionId } = Route.useSearch();

  // Fetch the navigator.
  const navigate = Route.useNavigate();

  // Fetch the OS config.
  const { agents, teams, workflows } = useConfig();

  // Create the callback for updating the chat config.
  const update = useCallback((options: ChatConfigUpdateOptions) => {
    navigate({ search: { ...options } });
  }, []);

  // Create the chat config, filling in defaults when possible.
  let chatConfig: ChatConfig;
  if (type && id) {
    chatConfig = {
      type,
      id,
      sessionId,
      update
    };
  } else if (agents.length > 0) {
    chatConfig = {
      type: 'agent',
      id: agents[0].id!,
      sessionId: undefined,
      update
    };
  } else if (teams.length > 0) {
    chatConfig = {
      type: 'team',
      id: teams[0].id!,
      sessionId: undefined,
      update
    };
  } else if (workflows.length > 0) {
    chatConfig = {
      type: 'workflow',
      id: workflows[0].id!,
      sessionId: undefined,
      update
    };
  } else {
    chatConfig = {
      type: undefined,
      id: undefined,
      sessionId: undefined,
      update
    };
  }

  // Return the rendered component.
  return (
    <ChatConfigProvider value={ chatConfig }>
      <Chat />
    </ChatConfigProvider>
  );
}
