/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import {
  Metrics
} from '@/components/metrics';

import * as v from 'valibot';

const
routeSearchSchema = v.object({
  agent_id: v.optional(v.string()),
});

export
const Route = createFileRoute('/metrics')({
  component: RouteComponent,
  validateSearch: routeSearchSchema,
});

function RouteComponent() {
  return <Metrics />;
}
