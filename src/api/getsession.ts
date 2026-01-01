/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * A schema for the details common to all agent/team/workflow.
 */
const sessionDetailCommonSchema = v.object({
  created_at: v.string(),
  session_id: v.string(),
  session_name: v.string(),
  session_state: v.object({}),
  updated_at: v.string(),
});


/**
 * A schema for session token metrics.
 */
const metricsSchema = v.object({
  input_tokens: v.number(),
  output_tokens: v.number(),
  total_tokens: v.number(),
  audio_total_tokens: v.number(),
  audio_input_tokens: v.number(),
  audio_output_tokens: v.number(),
  cache_read_tokens: v.number(),
  cache_write_tokens: v.number(),
  reasoning_tokens: v.number(),
});


/**
 * A schema for an agent session.
 */
export
const agentSessionDetailSchema = v.object({
  ...sessionDetailCommonSchema.entries,
  type: v.literal('agent'),
  metrics: metricsSchema,
  total_tokens: v.number(),
});


/**
 * A type alias for an agent session.
 */
export
type AgentSessionDetail = v.InferOutput<typeof agentSessionDetailSchema>;


/**
 * A schema for a team session.
 */
export
const teamSessionDetailSchema = v.object({
  ...sessionDetailCommonSchema.entries,
  type: v.literal('team'),
  metrics: metricsSchema,
  total_tokens: v.number()
});


/**
 * A type alias for a team session.
 */
export
type TeamSessionDetail = v.InferOutput<typeof teamSessionDetailSchema>;


/**
 * A schema for a workflow session.
 */
export
const workflowSessionDetailSchema = v.object({
  ...sessionDetailCommonSchema.entries,
  type: v.literal('workflow'),
});


/**
 * A type alias for a workflow session.
 */
export
type WorkflowSessionDetail = v.InferOutput<typeof workflowSessionDetailSchema>;


/**
 * A schema for an agent/team/workflow session.
 */
export
const sessionDetailSchema = v.variant('type', [
  agentSessionDetailSchema,
  teamSessionDetailSchema,
  workflowSessionDetailSchema
]);


/**
 * A type alias for an Agno session detail.
 */
export
type SessionDetail = v.InferOutput<typeof sessionDetailSchema>;


/**
 * A function which fetches the agno session detail.
 *
 * @param options - The options for the request.
 *
 * @returns A promise that resolves with the sessions request.
 */
export
async function getSession(options: getSession.Options): Promise<SessionDetail> {
  // Extract the options.
  const { type, sessionId } = options;

  // Fetch the resource.
  const resp = await fetch(`/api/sessions/${sessionId}?type=${type}`);

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  //
  // Add the session type to the response since it isnt provided by the API.
  const json = { type, ...(await resp.json()) };

  // Return the parsed result.
  return v.parse(sessionDetailSchema, json);
}


/**
 * The namespace for the `getSession` statics.
 */
export
namespace getSession {
  /**
   * A type alias for the `getSession` options.
   */
  export
  type Options = {
    /**
     * The type of the session to retrieve.
     */
    readonly type: 'agent' | 'team' | 'workflow';

    /**
     * The id of the session to retrieve.
     */
    readonly sessionId: string;
  };
}
