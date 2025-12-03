/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

const tokenMetricsSchema = v.object({
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

const modelMetricSchema = v.object({
  model_id: v.string(),
  model_provider: v.string(),
  count: v.number(),
});

const metricsRowSchema = v.object({
  id: v.string(),
  agent_runs_count: v.number(),
  agent_sessions_count: v.number(),
  team_runs_count: v.number(),
  team_sessions_count: v.number(),
  workflow_runs_count: v.number(),
  workflow_sessions_count: v.number(),
  users_count: v.number(),
  token_metrics: tokenMetricsSchema,
  model_metrics: v.array(modelMetricSchema),
  date: v.string(),
  created_at: v.number(),
  updated_at: v.number(),
});

export const metricsResponseSchema = v.object({
  metrics: v.array(metricsRowSchema),
  updated_at: v.string(),
});

export
type MetricsResponse = v.InferOutput<typeof metricsResponseSchema>;

export
type MetricsRow = v.InferOutput<typeof metricsRowSchema>;

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
  session_id: v.string()
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
const chatHistoryMessageSchema = v.object({
  content: v.optional(v.string()),  // TODO this schema is not well-typed
  created_at: v.number(),
  from_history: v.boolean(),
  stop_after_tool_call: v.boolean(),
  role: v.string()
});


export
type ChatHistoryMessage = v.InferOutput<typeof chatHistoryMessageSchema>;


export
const agentSessionDetailSchema = v.object({
  agent_session_id: v.string(),
  session_id: v.string(),
  session_name: v.string(),
  user_id: v.nullish(v.string()),
  agent_id: v.nullish(v.string()),
  chat_history: v.array(chatHistoryMessageSchema)
});


export
const sessionByIDSchema = v.union([agentSessionDetailSchema]);


export
type SessionByID = v.InferOutput<typeof sessionByIDSchema>;
