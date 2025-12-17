/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * A schema for Agno metrics.
 *
 * TODO rename or move this for message metrics.
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
 *
 * TODO rename or move this for message metrics.
 */
export
type Metrics = v.InferOutput<typeof metricsSchema>;


/**
 * A schema for Agno token metrics.
 */
export
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


/**
 * A type alias for Agno token metrics.
 */
export
type TokenMetrics = v.InferOutput<typeof tokenMetricsSchema>;


/**
 * A schema for Agno model metrics.
 */
export
const modelMetricSchema = v.object({
  model_id: v.string(),
  model_provider: v.string(),
  count: v.number(),
});


/**
 * A type alias for Agno model metrics.
 */
export
type ModelMetrics = v.InferOutput<typeof modelMetricSchema>;


/**
 * A schema for Agno ...
 */
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


/**
 * A type alias for Agno ...
 */
export
type MetricsRow = v.InferOutput<typeof metricsRowSchema>;


/**
 *
 */
export const metricsResponseSchema = v.object({
  metrics: v.array(metricsRowSchema),
  updated_at: v.nullable(v.string()),
});


/**
 *
 */
export
type MetricsResponse = v.InferOutput<typeof metricsResponseSchema>;


/**
 *
 */
export
async function getMetrics(options: getMetrics.Options): Promise<MetricsResponse> {
  //
  const { starting_date, ending_date } = options;

  const params = new URLSearchParams();

  if (starting_date) {
    params.append('starting_date', starting_date);
  }
  if (ending_date) {
    params.append('ending_date', ending_date);
  }

  // Fetch the resource.
  const resp = await fetch(`/agno_metrics?${params}`);

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the respon to JSON.
  const json = await resp.json();

  // Return the parsed result.
  return v.parse(metricsResponseSchema, json);
}


/**
 *
 */
export
namespace getMetrics {
  /**
   *
   */
  export
  type Options = {
    /**
     *
     */
    readonly starting_date?: string;

    /**
     *
     */
    readonly ending_date?: string;
  };
}
