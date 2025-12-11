/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * A schema for Agno metrics.
 */
export
const metricsSchema = v.object({
  duration: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  time_to_first_token: v.number(),
  total_tokens: v.number()
});


/**
 * A type alias for Agno metrics.
 */
export
type Metrics = v.InferOutput<typeof metricsSchema>;

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
async function getMetrics(): Promise<MetricsResponse> {
  const url = '/agno_metrics';

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Response: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  return v.parse(metricsResponseSchema, json);
}