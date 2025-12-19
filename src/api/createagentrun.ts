/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import {
  SSEParserStream
} from '@/lib/sse';

import {
  toolCallSchema
} from './tools';


/**
 * A schema for the Agno `RunStarted` event.
 */
export
const runStartedEventSchema = v.object({
  event: v.literal('RunStarted'),
  agent_id: v.string(),
  agent_name: v.string(),
  created_at: v.number(),
  model: v.string(),
  model_provider: v.string(),
  run_id: v.string(),
  session_id: v.string()
});


/**
 * A type alias for the Agno `RunStarted` event.
 */
export
type RunStartedEvent = v.InferOutput<typeof runStartedEventSchema>;


/**
 * A schema for the Agno `RunContent` event.
 */
export
const runContentEventSchema = v.object({
  event: v.literal('RunContent'),
  agent_id: v.string(),
  agent_name: v.string(),
  content: v.string(),
  content_type: v.string(),
  created_at: v.number(),
  reasoning_content: v.string(),
  run_id: v.string(),
  session_id: v.string(),
  workflow_agent: v.boolean()
});


/**
 * A type alias for the Agno `RunContent` event.
 */
export
type RunContentEvent = v.InferOutput<typeof runContentEventSchema>;


/**
 * A schema for the Agno `RunContentCompleted` event.
 */
export
const runContentCompletedEventSchema = v.object({
  event: v.literal('RunContentCompleted'),
  agent_id: v.string(),
  agent_name: v.string(),
  created_at: v.number(),
  run_id: v.string(),
  session_id: v.string()
});


/**
 * A type alias for the Agno `RunContentCompleted` event.
 */
export
type RunContentCompletedEvent = v.InferOutput<typeof runContentCompletedEventSchema>;


/**
 * A schema for Agno run metrics.
 */
export
const runMetricsSchema = v.object({
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
type RunMetrics = v.InferOutput<typeof runMetricsSchema>;


/**
 * A schema for the Agno `RunCompleted` event.
 */
export
const runCompletedEventSchema = v.object({
  event: v.literal('RunCompleted'),
  agent_id: v.string(),
  agent_name: v.string(),
  content: v.string(),
  content_type: v.string(),
  created_at: v.number(),
  metrics: runMetricsSchema,
  run_id: v.string(),
  session_id: v.string()
});


/**
 * A type alias for the Agno `RunCompleted` event.
 */
export
type RunCompletedEvent = v.InferOutput<typeof runCompletedEventSchema>;


/**
 * The common schema for tool call events.
 */
const toolCallEventCommonSchema = v.object({
  agent_id: v.string(),
  agent_name: v.string(),
  created_at: v.number(),
  run_id: v.string(),
  session_id: v.string(),
  tool: toolCallSchema
});


/**
 * A schema for the Agno `ToolCallStarted` event.
 */
export
const toolCallStartedEventSchema = v.object({
  ...toolCallEventCommonSchema.entries,
  event: v.literal('ToolCallStarted')
});


/**
 * A type alias for the Agno `ToolCallStarted` event.
 */
export
type ToolCallStartedEvent = v.InferOutput<typeof toolCallStartedEventSchema>;


/**
 * A schema for the Agno `ToolCallCompleted` event.
 */
export
const toolCallCompletedEventSchema = v.object({
  ...toolCallEventCommonSchema.entries,
  event: v.literal('ToolCallCompleted'),
  content: v.string()
});


/**
 * A type alias for the Agno `ToolCallCompleted` event.
 */
export
type ToolCallCompletedEvent = v.InferOutput<typeof toolCallCompletedEventSchema>;


/**
 * A schema union of the Agno run events.
 */
export
const runEventSchema = v.union([
  runStartedEventSchema,
  runContentEventSchema,
  runContentCompletedEventSchema,
  runCompletedEventSchema,
  toolCallStartedEventSchema,
  toolCallCompletedEventSchema
]);


/**
 * A type alias for the Agno run events union.
 */
export
type RunEvent = v.InferOutput<typeof runEventSchema>;


/**
 * A function which executes the Agno run agent api.
 *
 * @param options - The options for the api request.
 *
 * @returns An async generator of run events.
 */
export
async function *createAgentRun(
  options: createAgentRun.Options
): AsyncGenerator<RunEvent> {
  // Extract the options.
  const { agent_id, message, session_id, user_id } = options;

  // Create the form data for the request.
  const fd = new FormData();

  // Set the required form data.
  fd.append('message', message);
  fd.append('stream', 'true');

  // Set the optional form data.
  if (session_id) {
    fd.append('session_id', session_id);
  }
  if (user_id) {
    fd.append('user_id', user_id);
  }

  // Fetch the endpoint.
  const resp = await fetch(`/agents/${agent_id}/runs`, {
    method: 'POST', body: fd
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Setup the SSE stream parser.
  const stream = resp.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new SSEParserStream());

  // Yield the run events.
  for await (const evt of stream) {
    // Parse the SSE data into json.
    const json = JSON.parse(evt.data);

    // Validate the JSON against the schema.
    try {
      yield v.parse(runEventSchema, json);
    } catch (e) {
      // TODO log errors and json for unhandled events for now.
      console.log('Failed to parse in `createAgentRun()`');
      console.log(e);
      console.log(json);
    }
  }
}


/**
 * The namespace for the `createAgentRun` statics.
 */
export
namespace createAgentRun {
  /**
   * An options object for a `createAgentRun` request.
   */
  export
  type Options = {
    /**
     * The id of the agent to invoke.
     */
    readonly agent_id: string;

    /**
     * The user message to the agent.
     */
    readonly message: string;

    /**
     * The unique id of the existing session for the agent.
     */
    readonly session_id: string;

    /**
     * The unique id of the user making the request.
     */
    readonly user_id?: string;
  };
}
