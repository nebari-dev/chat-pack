/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import {
  getAuthToken
} from '@/auth';


/**
 * A type alias for token metrics.
 *
 * These can be specific to a run, or aggregated depending on the API
 * endpoint that was invoked. They can also be specific to a time range
 * if the API options allowed for a time range.
 *
 *
 * TODO - add more token fields.
 */
export
type TokenMetrics = {
  /**
   * The total input tokens for the specified time range.
   */
  readonly inputTokens: number;

  /**
   * The total output tokens for the specified time range.
   */
  readonly outputTokens: number;

  /**
   * The aggregate total of all tokens for the specified time range.
   *
   * This may be more than `inputTokens + outputTokens` if the provider
   * supports other tokens such as `audio`, `thinking`, etc.
   */
  readonly totalTokens: number;
};


/**
 * A type alias for model metrics.
 *
 * This type is used to track specific model runs over a time range.
 */
export
type ModelMetrics = {
  /**
   * The unique id of the model.
   */
  readonly modelId: string;

  /**
   * The name of the endpoint provider that hosted the model.
   */
  readonly modelProvider: string;

  /**
   * The number of runs for this model within the specified time range.
   */
  readonly runCount: number;
};


/**
 * A type alias for the aggregate metrics by-day.
 */
export
type Metrics = {
  /**
   * The ISO UTC date string of the metrics.
   *
   * The app metrics should be aggregated by ISO UTC day.
   */
  readonly date: string;

  /**
   * The total number of runs across all sessions for the day.
   */
  readonly runsCount: number;

  /**
   * The total number of sessions for the day.
   */
  readonly sessionsCount: number;

  /**
   * The aggregate token metrics across all sessions for the day.
   */
  readonly tokenMetrics: TokenMetrics;

  /**
   * The aggregate model metrics across all sessions for the day.
   */
  readonly modelMetrics: readonly ModelMetrics[];
};


/**
 * Fetch the aggregate application metrics.
 *
 * @params options - The options to specify the time range for the query.
 *
 * @returns The aggregate metrics results for the requested time range.
 */
export
async function getMetrics(options: getMetrics.Options): Promise<readonly Metrics[]> {
  // Extract the options.
  const { startDate, endDate } = options;

  // Create the search params for the request.
  const params = new URLSearchParams();
  params.append('starting_date', startDate);
  params.append('ending_date', endDate);

  // Ensure the metrics are up-to-date.
  //
  // TODO - if this POST becomes a performance problem, we may need to
  // implement a caching strategy, refresh on a timer, etc.
  await fetch('/api/metrics/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Fetch the Agno OS config schema.
  const resp = await fetch(`/api/metrics?${params}`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to json.
  const json = await resp.json();

  // Parse the response.
  const parsed = v.parse(Private.metricsSchema, json);

  // Return the translated result.
  return parsed.metrics.map(row => ({
    date: row.updated_at,
    runsCount: row.agent_runs_count,
    sessionsCount: row.agent_sessions_count,
    tokenMetrics: Private.convertTokenMetrics(row.token_metrics),
    modelMetrics: row.model_metrics.map(Private.convertModelMetrics)
  }));
}


/**
 * The namespace for the `getMetrics` statics.
 */
export
namespace getMetrics {
  /**
   * A type alias for the `getMetrics` options.
   */
  export
  type Options = {
    /**
     * The start date for the aggregate metrics, inclusive.
     *
     * This is formatted as an ISO UTC string.
     */
    readonly startDate: string;

    /**
     * The end date for the aggregate metrics, inclusive.
     *
     * This is formatted as an ISO UTC string.
     */
    readonly endDate: string;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  // A schema for Agno token metrics.
  const tokenMetricsSchema = v.object({
    input_tokens: v.number(),
    output_tokens: v.number(),
    total_tokens: v.number(),
  });

  // A schema for Agno model metrics.
  const modelMetricsSchema = v.object({
    model_id: v.string(),
    model_provider: v.string(),
    count: v.number(),
  });

  // A schema for an agno metrics row.
  const metricsRowSchema = v.object({
    agent_runs_count: v.number(),
    agent_sessions_count: v.number(),
    token_metrics: tokenMetricsSchema,
    model_metrics: v.array(modelMetricsSchema),
    updated_at: v.string(),
  });

  // A schmea for an agno metrics result.
  export
  const metricsSchema = v.object({
    metrics: v.array(metricsRowSchema)
  });

  /**
   * A function which converts Agno token metrics to api token metrics.
   */
  export
  function convertTokenMetrics(
    metrics: v.InferOutput<typeof tokenMetricsSchema>
  ): TokenMetrics {
    return {
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      totalTokens: metrics.total_tokens
    };
  }

  /**
   * A function which converts Agno model metrics to api model metrics.
   */
  export
  function convertModelMetrics(
    metrics: v.InferOutput<typeof modelMetricsSchema>
  ): ModelMetrics {
    return {
      modelId: metrics.model_id,
      modelProvider: metrics.model_provider,
      runCount: metrics.count
    };
  }
}
