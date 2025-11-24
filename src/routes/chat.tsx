/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import * as v from 'valibot';

import {
  Chat
} from '@/components/chat';


const
routeSearchSchema = v.object({
  agent_id: v.optional(v.string()), // TODO validate agent id?
  session_id: v.optional(v.string()), // TODO validate UUID4 format?
});


export
const Route = createFileRoute('/chat')({
  component: RouteComponent,
  validateSearch: routeSearchSchema
});


function RouteComponent() {
  return <Chat />
}
