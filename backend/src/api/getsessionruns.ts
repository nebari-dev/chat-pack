/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import {
  metricsSchema
} from './metrics';

import {
  toolCallSchema
} from './tools';


/**
 * A schema for an Agno session run.
 */
export
const runSchema = v.object({
  agent_id: v.string(),
  content: v.string(),
  created_at: v.string(),
  metrics: metricsSchema,
  run_id: v.string(),
  run_input: v.string(),
  tools: v.nullish(v.array(toolCallSchema)),
  user_id: v.string(),
});


/**
 * A type alias for an Agno session run.
 */
export
type Run = v.InferOutput<typeof runSchema>;


/**
 * A function which gets the runs for a session.
 *
 * @param session_id - The unique id of the session.
 *
 * @returns A promise that resolves with the session runs.
 */
export
async function getSessionRuns(session_id: string): Promise<Run[]> {
  // Make the fetch request.
  const resp = await fetch(`/sessions/${session_id}/runs`);

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Parse the results.
  return v.parse(v.array(runSchema), json);
}
