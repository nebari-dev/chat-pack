/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


export
const runMetricsSchema = v.object({
  duration: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  time_to_first_token: v.number(),
  total_tokens: v.number()
});


export
type RunMetrics = v.InferOutput<typeof runMetricsSchema>;


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


export
type RunStartedEvent = v.InferOutput<typeof runStartedEventSchema>;


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


export
type RunContentEvent = v.InferOutput<typeof runContentEventSchema>;


export
const runContentCompletedEventSchema = v.object({
  event: v.literal('RunContentCompleted'),
  agent_id: v.string(),
  agent_name: v.string(),
  created_at: v.number(),
  run_id: v.string(),
  session_id: v.string()
});


export
type RunContentCompletedEvent = v.InferOutput<typeof runContentCompletedEventSchema>;


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
  session_id: v.string(),
  session_state: v.unknown() // TODO
});


export
type RunCompletedEvent = v.InferOutput<typeof runCompletedEventSchema>;


export
const runEventSchema = v.union([
  runStartedEventSchema,
  runContentEventSchema,
  runContentCompletedEventSchema,
  runCompletedEventSchema
]);


export
type RunEvent = v.InferOutput<typeof runEventSchema>;


export
const chatHistorySchema = v.object({
  content: v.optional(v.string()),  // TODO this schema is not well-typed
  created_at: v.number(),
  from_history: v.boolean(),
  stop_after_tool_call: v.boolean(),
  role: v.string()
});


export
type ChatHistory = v.InferOutput<typeof chatHistorySchema>;


export
const agentSessionDetailSchema = v.object({
  agent_session_id: v.string(),
  session_id: v.string(),
  session_name: v.string(),
  user_id: v.optional(v.string()),
  agent_id: v.optional(v.string()),
  chat_history: v.array(chatHistorySchema)
});


export
const sessionByIDSchema = v.union([agentSessionDetailSchema]);


export
type SessionByID = v.InferOutput<typeof sessionByIDSchema>;
