/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';
import {
  pb
} from './pb'

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
 * A schema for an Agno metrics row.
 */
export
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
 * A type alias an Agno metrics row.
 */
export
type MetricsRow = v.InferOutput<typeof metricsRowSchema>;


/**
 * A schema for Agno metrics.
 */
export
const metricsSchema = v.object({
  metrics: v.array(metricsRowSchema),
  updated_at: v.nullable(v.string()),
});


/**
 * A type alias for Agno metrics.
 */
export
type Metrics = v.InferOutput<typeof metricsSchema>;


/**
 * A function which fetches the agno metrics.
 *
 * @param options - The options for the api request.
 *
 * @returns A promise that resolves with the metrics request.
 */
export
async function getMetrics(options: getMetrics.Options): Promise<Metrics> {
  // Unpack the options.
  const { starting_date, ending_date } = options;

  // Create the search params for the request.
  const params = new URLSearchParams();

  // Add the requested date range to the search params.
  if (starting_date) {
    params.append('starting_date', starting_date);
  }
  if (ending_date) {
    params.append('ending_date', ending_date);
  }

  // Ensure the metrics are up-to-date.
  //
  // TODO - if this POST becomes a performance problem, we may need to
  // implement a caching strategy, refresh on a timer, etc.
  await fetch('/api/metrics/refresh', { method: 'POST' });

  // Fetch the resource.
  const resp = await fetch(`/api/metrics?${params}`, {
    headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
  });

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Return the parsed result.
  return v.parse(metricsSchema, json);
}


/**
 * The namespace for the `getMetrics` statics.
 */
export
namespace getMetrics {
  /**
   * A type alias for the options to `getMetrics`.
   */
  export
  type Options = {
    /**
     * The starting date in `YYYY-MM-DD` UTC format.
     */
    readonly starting_date?: string;

    /**
     * The ending date in `YYYY-MM-DD` UTC format.
     */
    readonly ending_date?: string;
  };
}
