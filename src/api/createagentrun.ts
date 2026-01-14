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

import {
  pb
} from './pb'


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
 * A schema for a user input.
 */
export
const userInputSchemaSchema = v.object({
  name: v.string(),
  field_type: v.string(),
  description: v.string(),
  value: v.any()
});


/**
 * A type alias for a user input schema.
 */
export
type UserInputSchema = v.InferOutput<typeof userInputSchemaSchema>;


/**
 * A schema for an Agno tool execution.
 */
export
const toolExecutionSchema = v.object({
  confirmation_note: v.nullish(v.string()),
  confirmed: v.nullish(v.boolean()),
  created_at: v.number(),
  external_execution_required: v.nullish(v.boolean()),
  requires_confirmation: v.nullish(v.boolean()),
  requires_user_input: v.nullish(v.boolean()),
  tool_args: v.looseObject({}),
  tool_call_id: v.string(),
  tool_name: v.string(),
  user_input_schema: v.nullish(v.array(userInputSchemaSchema))
});


/**
 * A type alias for an Agno tool execution.
 */
export
type ToolExecution = v.InferOutput<typeof toolExecutionSchema>;


/**
 * A schema for the Agno `RunPaused` event.
 */
export
const runPausedEventSchema = v.object({
  event: v.literal('RunPaused'),
  agent_id: v.string(),
  agent_name: v.string(),
  content: v.string(),
  created_at: v.number(),
  run_id: v.string(),
  session_id: v.string(),
  tools: v.array(toolExecutionSchema)
});


/**
 * A type alias for the Agno `RunPaused` event.
 */
export
type RunPausedEvent = v.InferOutput<typeof runPausedEventSchema>;


/**
 * A schema for the Agno `RunContinued` event.
 */
export
const runContinuedEventSchema = v.object({
  event: v.literal('RunContinued'),
  agent_id: v.string(),
  agent_name: v.string(),
  created_at: v.number(),
  run_id: v.string(),
  session_id: v.string()
});


/**
 * A type alias for the Agno `RunContinued` event.
 */
export
type RunContinuedEvent = v.InferOutput<typeof runContinuedEventSchema>;


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
  runPausedEventSchema,
  runContinuedEventSchema,
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
  const { agent_id, message, session_id } = options;

  // Create the form data for the request.
  const fd = new FormData();
  fd.append('message', message);
  fd.append('stream', 'true');
  fd.append('session_id', session_id);

  // Fetch the endpoint.
  const resp = await fetch(`/api/agents/${agent_id}/runs`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${pb.authStore.token}` },
    body: fd
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
  };
}


/**
 * A function which continues an Agno agent run for HITL interaction.
 *
 * @param options - The options for the api request.
 *
 * @returns An async generator of run events.
 */
export
async function *continueAgentRun(
  options: continueAgentRun.Options
): AsyncGenerator<RunEvent> {
  // Extract the options.
  const { agent_id, run_id, session_id, tools } = options;

  // Create the form data for the request.
  const fd = new FormData();
  fd.append('session_id', session_id);
  fd.append('tools', JSON.stringify(tools));

  // Fetch the endpoint.
  const resp = await fetch(`/api/agents/${agent_id}/runs/${run_id}/continue`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${pb.authStore.token}` },
    body: fd
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
      console.log('Failed to parse in `continueAgentRun()`');
      console.log(e);
      console.log(json);
    }
  }
}


/**
 * The namespace for the `createAgentRun` statics.
 */
export
namespace continueAgentRun {
  /**
   * An options object for a `createAgentRun` request.
   */
  export
  type Options = {
    /**
     * The unique id of the agent.
     */
    readonly agent_id: string;

    /**
     * The unique id of the run.
     */
    readonly run_id: string;

    /**
     * The unique id of the session.
     */
    readonly session_id: string;

    /**
     * The array of tool executions.
     */
    readonly tools: readonly ToolExecution[];
  };
}
