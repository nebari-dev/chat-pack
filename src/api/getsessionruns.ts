/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import {
  pb
} from './pb'

import {
  runEventSchema
} from './createagentrun';

import {
  toolCallSchema
} from './tools';


/**
 * A schema for Agno session run metrics.
 */
export
const sessionRunMetricsSchema = v.object({
  duration: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  time_to_first_token: v.number(),
  total_tokens: v.number()
});


/**
 * A type alias for Agno run metrics.
 */
export
type SessionRunMetrics = v.InferOutput<typeof sessionRunMetricsSchema>;


/**
 * A schema for an Agno session run.
 */
export
const sessionRunSchema = v.object({
  agent_id: v.string(),
  content: v.string(),
  created_at: v.string(),
  events: v.nullish(v.array(runEventSchema)),
  metrics: sessionRunMetricsSchema,
  run_id: v.string(),
  run_input: v.string(),
  tools: v.nullish(v.array(toolCallSchema)),
  user_id: v.string(),
});


/**
 * A type alias for an Agno session run.
 */
export
type SessionRun = v.InferOutput<typeof sessionRunSchema>;


/**
 * A function which gets the runs for a session.
 *
 * @param session_id - The unique id of the session.
 *
 * @returns A promise that resolves with the session runs.
 */
export
async function getSessionRuns(session_id: string): Promise<SessionRun[]> {
  // Make the fetch request.
  const resp = await fetch(`/api/sessions/${session_id}/runs`, {
    headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Parse the results.
  return v.parse(v.array(sessionRunSchema), json);
}
